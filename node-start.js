const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT = process.argv[2];
if (!PROJECT) {
  console.error("Usage: node-start PROJECT");
  console.error("Project setup.");
  process.exit(1);
}

const PROJECT_TITLE = `${PROJECT[0].toUpperCase()}${PROJECT.slice(1)}`;

const run = (cmd) => {
  const options = { stdio: "inherit" };
  //cmd = cmd + " > /dev/null 2>&1";
  execSync(cmd, options);
};

const createDirectories = (dirs) => dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));
const createFiles = (files) => files.forEach(file => fs.writeFileSync(file, ""));

run(`mkdir ${PROJECT}`);
process.chdir(PROJECT);
run("npm init -y");

let directories = [
  "data/db", "data/migrations", "data/seeds", "data/files",
  "doc", "lib", "src/controllers", "src/middlewares",
  "src/validators", "views/users", "test"
];
let placeholderFiles = [
  "data/db/.gitkeep", "data/files/.gitkeep", "doc/.gitkeep",
  "test/.gitkeep", "views/.gitkeep"
];

createDirectories(directories);
createFiles(placeholderFiles);

//run("license MIT");
//run("gitignore Node");
//fs.appendFileSync(".gitignore", "/data/db\n/data/files\n");

const installDeps = (deps, dev = false) => run(`npm i --loglevel silent ${dev ? "-D " : ""}${deps.join(" ")}`, true);
installDeps([
  "bcrypt", "body-parser", "bootstrap", "connect-session-knex",
  "cookie-parser", "ejs", "express", "express-session",
  "knex", "morgan", "pg", "validator"
]);
installDeps(["concurrently", "nodemon", "sqlite3"], true);

run(`ng new ${PROJECT} --routing --style=scss --skip-tests --ssr=false --skip-git --directory=./templates`, true);
fs.unlinkSync("./templates/README.md");

const defineAngularConfig = () => {
  const proxyConfig = {
    "/api": { "target": "http://localhost:3000/api", "secure": false, "pathRewrite": { "^/api": "" } },
    "/files": { "target": "http://localhost:3000/files", "secure": false, "pathRewrite": { "^/files": "" } }
  };

  fs.writeFileSync("./templates/proxy.conf.json", JSON.stringify(proxyConfig, null, 2));

  const angularJsonPath = "./templates/angular.json";
  const angularJson = JSON.parse(fs.readFileSync(angularJsonPath));

  angularJson.projects[PROJECT].architect.serve.options = { proxyConfig: "./proxy.conf.json" };
  const buildOptions = angularJson.projects[PROJECT].architect.build.options;
  buildOptions.styles = [...(buildOptions.styles || []), "node_modules/bootstrap/dist/css/bootstrap.min.css"];
  buildOptions.scripts = [...(buildOptions.scripts || []), "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"];

  fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
};
defineAngularConfig();
process.chdir("templates");
installDeps(["bootstrap", "validator"]);
process.chdir("..");

const templateBasePath = path.join(__dirname, "templates/node-start/");
const fileMappings = [
  { template: "index.js", destination: "index.js" },
  { template: "knexfile.js", destination: "knexfile.js" },
  { template: "db.js", destination: "src/db.js" },
  { template: "nodemon.json", destination: "nodemon.json" },
  { template: "status.ejs", destination: "views/status.ejs" },
  { template: "signin.ejs", destination: "views/users/signin.ejs" },
  { template: "signup.ejs", destination: "views/users/signup.ejs" },
  { template: "user-controller.js", destination: "src/controllers/user-controller.js" },
  { template: "user-validator.js", destination: "src/validators/user-validator.js" },
  { template: "validator-exception.js", destination: "lib/validator-exception.js" },
  { template: "routes.js", destination: "src/routes.js" },
];

const templateVariables = {
  PROJECT: PROJECT,
  PROJECT_TITLE: PROJECT_TITLE,
};

function renderTemplate(template, variables) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, variable) => {
    return variables[variable] !== undefined ? variables[variable] : match;
  });
}

fileMappings.forEach(({ destination }) => {
  const destinationDir = path.dirname(destination);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }
});

fileMappings.forEach(({ template, destination }) => {
  const templateContent = fs.readFileSync(path.join(templateBasePath, template), "utf8");
  const outputContent = renderTemplate(templateContent, templateVariables);

  fs.writeFileSync(destination, outputContent);
});

const migrationsDir = "data/migrations";
const migrationContent = fs.readFileSync(path.join(templateBasePath, "create_user_migration.js"), "utf8");
run("npx knex migrate:make create_users", true);
const [firstMigrationFile] = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".js")).sort();
fs.writeFileSync(path.join(migrationsDir, firstMigrationFile), migrationContent);
run("npx knex migrate:latest", true);

console.log(`Project ${PROJECT_TITLE} setup complete.`);