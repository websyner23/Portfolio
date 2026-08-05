import { App as AntApp, ConfigProvider, theme as antdTheme } from "antd";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { BRAND } from "./config";
import { useAppSelector } from "./redux/hooks";
import { router } from "./routes/router";

const App = () => {
  const themeMode = useAppSelector((s) => s.ui.themeMode);

  return (
    <ConfigProvider
      theme={{
        algorithm:
          themeMode === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: BRAND.colorPrimary,
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <Toaster
          richColors
          position="top-right"
          theme={themeMode === "dark" ? "dark" : "light"}
        />
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
