import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useSignalAlarm } from "./context/SignalAlarmContext";

export default function Index() {
  const {
    enabled,
    setEnabled,
    intervalSeconds,
    setIntervalSeconds,
    hasSignal,
    isChecking,
    intervalOptions,
  } = useSignalAlarm();

  const statusText =
    hasSignal === null
      ? "Comprobando…"
      : hasSignal
        ? "Con cobertura"
        : "Sin cobertura";
  const statusColor = hasSignal === null ? "#666" : hasSignal ? "#0a0" : "#c00";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      bounces={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Alarma de cobertura</Text>
        <Text style={styles.subtitle}>
          Suena cuando recuperas señal después de haberla perdido (solo Android).
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Activar alarma</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: "#ccc", true: "#4a9" }}
            thumbColor="#fff"
          />
        </View>

        {enabled && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Comprobar cada</Text>
            </View>
            <View style={styles.intervalRow}>
              {intervalOptions.map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.intervalBtn,
                    intervalSeconds === sec && styles.intervalBtnActive,
                  ]}
                  onPress={() => setIntervalSeconds(sec)}
                >
                  <Text
                    style={[
                      styles.intervalBtnText,
                      intervalSeconds === sec && styles.intervalBtnTextActive,
                    ]}
                  >
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={[styles.statusBox, { borderLeftColor: statusColor }]}>
          <Text style={styles.statusLabel}>Estado</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>
            {statusText}
          </Text>
          {enabled && isChecking && (
            <Text style={styles.hint}>
              Comprobando cada {intervalSeconds} s en segundo plano
            </Text>
          )}
        </View>

        {enabled && (
          <Text style={styles.batteryHint}>
            Para que siga comprobando con la app en segundo plano, desactiva la
            optimización de batería para esta app en Ajustes del sistema.
          </Text>
        )}
      </View>

      {Platform.OS !== "android" && (
        <Text style={styles.warn}>
          Esta app está pensada solo para Android. En otros dispositivos la
          alarma puede no funcionar en segundo plano.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  content: {
    padding: 20,
    paddingTop: 56,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: "#333",
  },
  intervalRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  intervalBtnActive: {
    backgroundColor: "#4a9",
  },
  intervalBtnText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  intervalBtnTextActive: {
    color: "#fff",
  },
  statusBox: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
  },
  batteryHint: {
    marginTop: 14,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 18,
  },
  warn: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    color: "#856404",
    fontSize: 13,
  },
});
