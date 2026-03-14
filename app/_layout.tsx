import { Stack } from "expo-router";
import { SignalAlarmProvider } from "./context/SignalAlarmContext";

export default function RootLayout() {
  return (
    <SignalAlarmProvider>
      <Stack />
    </SignalAlarmProvider>
  );
}
