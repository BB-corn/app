import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { BuildingRecognitionScreen } from "../screens/BuildingRecognitionScreen.native";
// 定义导航参数类型，确保导航时参数的正确性
export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  BuildingRecognition: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 18
        }
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "地图应用" }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ title: "地图" }} />
      <Stack.Screen
        name="BuildingRecognition"
        component={BuildingRecognitionScreen}
        options={{ title: "智能建筑识别" }}
      />
    </Stack.Navigator>
  );
}
