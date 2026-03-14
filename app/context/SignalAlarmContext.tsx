import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Platform, Vibration } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  ENABLED: "@signal_alarm_enabled",
  INTERVAL: "@signal_alarm_interval",
} as const;

const DEFAULT_INTERVAL_SECONDS = 30;
const INTERVAL_OPTIONS = [15, 30, 60] as const;

type IntervalOption = (typeof INTERVAL_OPTIONS)[number];

type SignalAlarmContextType = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  intervalSeconds: number;
  setIntervalSeconds: (v: number) => void;
  hasSignal: boolean | null;
  isChecking: boolean;
  intervalOptions: readonly number[];
};

const SignalAlarmContext = createContext<SignalAlarmContextType | null>(null);

function isConnected(state: NetInfoState | null): boolean {
  if (!state || !state.isConnected) return false;
  return state.isConnected;
}

export function SignalAlarmProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [intervalSeconds, setIntervalSecondsState] = useState(DEFAULT_INTERVAL_SECONDS);
  const [hasSignal, setHasSignal] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const wasWithoutSignalRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const playAlarm = useCallback(async () => {
    if (Platform.OS !== "android") return;
    // Patrón de vibración: pausa, vibración, pausa, vibración larga (alarma)
    Vibration.vibrate([0, 400, 200, 400, 200, 800], true);
    try {
      // Sonido opcional: coloca alarm.mp3 en assets/sounds/ y descomenta:
      // const { sound } = await Audio.Sound.createAsync(require("../assets/sounds/alarm.mp3"));
      // soundRef.current = sound; await sound.playAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://assets.mixkit.co/active_storage/sfx/2869-notification-percussion-2869.wav" }
      );
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinishAndNotJustLooped) {
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      // Solo vibración si falla la descarga del sonido
    }
  }, []);

  const checkSignal = useCallback(async () => {
    const state = await NetInfo.fetch();
    const connected = isConnected(state);
    setHasSignal(connected);

    if (connected) {
      if (wasWithoutSignalRef.current) {
        wasWithoutSignalRef.current = false;
        await playAlarm();
      }
    } else {
      wasWithoutSignalRef.current = true;
    }
  }, [playAlarm]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    setIsChecking(true);
    checkSignal();
    intervalRef.current = setInterval(checkSignal, intervalSeconds * 1000);
  }, [intervalSeconds, checkSignal]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsChecking(false);
  }, []);

  const setEnabled = useCallback(
    async (value: boolean) => {
      setEnabledState(value);
      await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, JSON.stringify(value));
      if (value) {
        startPolling();
      } else {
        stopPolling();
      }
    },
    [startPolling, stopPolling]
  );

  const setIntervalSeconds = useCallback(
    async (value: number) => {
      setIntervalSecondsState(value);
      await AsyncStorage.setItem(STORAGE_KEYS.INTERVAL, String(value));
      if (enabled && intervalRef.current) {
        stopPolling();
        startPolling();
      }
    },
    [enabled, startPolling, stopPolling]
  );

  // Cargar estado guardado al montar
  useEffect(() => {
    (async () => {
      try {
        const [savedEnabled, savedInterval] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.INTERVAL),
        ]);
        if (savedEnabled != null) setEnabledState(JSON.parse(savedEnabled));
        if (savedInterval != null) {
          const n = parseInt(savedInterval, 10);
          if (INTERVAL_OPTIONS.includes(n as IntervalOption)) setIntervalSecondsState(n);
        }
      } catch {}
    })();
  }, []);

  // Iniciar/parar según enabled; reiniciar cuando cambie el intervalo
  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }
    startPolling();
    return () => stopPolling();
  }, [enabled, intervalSeconds]);

  // Mantener comprobaciones activas cuando la app pasa a segundo plano (Android)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (Platform.OS !== "android") return;
      if (enabled && nextState === "background") {
        // Sigue corriendo el setInterval mientras el proceso esté vivo
        if (!intervalRef.current) startPolling();
      }
    });
    return () => sub.remove();
  }, [enabled, startPolling]);

  // Estado inicial de señal al montar
  useEffect(() => {
    NetInfo.fetch().then((state) => setHasSignal(isConnected(state)));
  }, []);

  const value: SignalAlarmContextType = {
    enabled,
    setEnabled,
    intervalSeconds,
    setIntervalSeconds,
    hasSignal,
    isChecking,
    intervalOptions: INTERVAL_OPTIONS,
  };

  return (
    <SignalAlarmContext.Provider value={value}>
      {children}
    </SignalAlarmContext.Provider>
  );
}

export function useSignalAlarm() {
  const ctx = useContext(SignalAlarmContext);
  if (!ctx) throw new Error("useSignalAlarm must be used within SignalAlarmProvider");
  return ctx;
}
