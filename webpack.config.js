const fs = require("fs");
const path = require("path");

const SELECTED_FILE = path.resolve(
  __dirname,
  "node_modules",
  ".cache",
  "selected-modules.json"
);
const MODULES_DIR = path.resolve(__dirname, "packages");
const SELECT_UI_HTML = path.resolve(__dirname, "module-selector-ui.html");

function getSelectedModules() {
  return fs.existsSync(SELECTED_FILE)
    ? JSON.parse(fs.readFileSync(SELECTED_FILE, "utf-8"))
    : [];
}

module.exports = {
  mode: "development",
  entry: async () => {
    const selectedModules = getSelectedModules();
    const entries = {};
    for (const name of selectedModules) {
      entries[name] = path.resolve(__dirname, `packages/${name}/entry.ts`);
    }
    return entries;
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 8080,
    setupMiddlewares: (middlewares, devServer) => {
      const app = devServer.app;
      if (!app) return middlewares;

      app.use(require("express").json());

      // Список доступных модулей
      app.get("/modules", (req, res) => {
        const modules = fs
          .readdirSync(MODULES_DIR)
          .filter((name) =>
            fs.existsSync(path.join(MODULES_DIR, name, "entry.ts"))
          );
        res.json(modules);
      });

      // Сохранение выбранных модулей и инвалидация
      app.post("/selected-modules", (req, res) => {
        fs.writeFileSync(SELECTED_FILE, JSON.stringify(req.body, null, 2));
        devServer.invalidate();
        res.sendStatus(200);
      });

      // Веб интерфейс для выбора модулей
      app.get("/select", (req, res) => {
        res.sendFile(SELECT_UI_HTML);
      });

      return middlewares;
    },
  },
};
