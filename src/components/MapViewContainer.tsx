import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  children: ReactNode;
}

export function MapViewContainer({ children }: Props) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden"
  }
});
