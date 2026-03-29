import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>地图软件框架</Text>
      <Text style={styles.desc}>已包含地图页、定位服务和地图 Provider 抽象。</Text>

      <Pressable style={styles.button} onPress={() => navigation.navigate("Map")}>
        <Text style={styles.buttonText}>进入地图</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("BuildingRecognition")}>
        <Text style={styles.secondaryButtonText}>智能识别建筑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary
  },
  desc: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff"
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    alignItems: "center"
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary
  }
});
