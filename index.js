import http from "node:http";
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolve } from "node:dns";
import { rejects } from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function readUsersFromFile() {
  const data = await readFile(join(__dirname, "data", "users.json"), "utf-8");
  return JSON.parse(data);
}

async function saveUser(users) {
  await writeFile(
    join(__dirname, "data", "users.json"),
    JSON.stringify(users, null, 2),
  );
}
function sendJSON(res, statuscode, data) {
  res.writeHead(statuscode, { "Content-type": "application/json" });
  res.end(JSON.stringify(data));
}
function sendHTML(res, statuscode, html) {
  res.writeHead(statuscode, { "Content-type": "text/HTML" });
  res.end(html);
}

function logger(req) {
  const now = new Date().toLocaleDateString();
  console.log(`[${now}] ${req.method} ${req.url}`);
}

function validateUserData(userData) {
  if (!userData.name || !userData.role) {
    return false;
  } else {
    return true;
  }
}

function parseBody(req) {
  return new Promise((resolve, rejects) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    try {
      req.on("end", () => {
        const newUserData = JSON.parse(body);
        resolve(newUserData);
      });
    } catch (error) {
      rejects(error);
    }
  });

  req.on("end", (error) => {
    rejects(error);
  });
}

async function sendFile(res, filepath, contentType) {
  try {
    const data = await readFile(filepath);

    res.writeHead(200, { "content-type": contentType });
    res.end(data);
  } catch (error) {
    sendHTML(res, 404, "<h1>File Not Found</h1>");
  }
}

//creating the server
const server = http.createServer(async (req, res) => {
  logger(req);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const parthPart = url.pathname.split("/");

  //Handle GET /api/users (list or filter)
  if (req.method === "GET" && url.pathname === "/api/users") {
    const users = await readUsersFromFile();
    const role = url.searchParams.get("role");

    let filteredUsers = users;

    if (role) {
      filteredUsers = users.filter((user) => user.role === role);
    }
    sendJSON(res, 200, filteredUsers);
  }

  //Hanndle POST /api/users
  else if (req.method === "POST" && url.pathname === "/api/users") {
    try {
      const newUserData = await parseBody(req);

      if (!validateUserData(newUserData)) {
        sendJSON(res, 400, { error: "name and role are required fields" });
        return;
      }

      const users = await readUsersFromFile();
      const newId =
        users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;

      const newUser = {
        name: newUserData.name,
        id: newId,
        role: newUserData.role,
      };

      users.push(newUser);

      await saveUser(users);

      sendJSON(res, 201, {
        message: "User Created Successfully",
        user: newUser,
      });

      res.end(
        JSON.stringify({
          message: "User Created Successfully",
          user: newUser,
        }),
      );
      console.log(users);
    } catch (error) {
      sendJSON(res, 400, { error: "Invalid JSON data" });
    }

    req.on("error", (err) => {
      sendJSON(res, 500, { error: "Invalid JSON data" });
    });
  }

  //Handle PUT /api/users/:id
  else if (
    req.method == "PUT" &&
    parthPart[1] === "api" &&
    parthPart[2] === "users" &&
    parthPart[3]
  ) {
    try {
      const userId = parseInt(parthPart[3]);
      const updatedUserData = await parseBody(req);

      if (!validateUserData(updatedUserData)) {
        sendJSON(res, 400, { error: "name and role are required fields" });
        return;
      }
      const users = await readUsersFromFile();

      const userIndex = users.findIndex((user) => user.id === userId);

      if (userIndex === -1) {
        sendJSON(res, 404, { error: "User not found" });
        return;
      }

      users[userIndex] = {
        id: userId,
        name: updatedUserData.name,
        role: updatedUserData.role,
      };
      await saveUser(users);
      sendJSON(res, 200, {
        message: "User Updated Successfully",
        user: users[userIndex],
      });

      console.log(users);
    } catch (error) {
      sendJSON(res, 400, { error: "Invalid JSON data" });
    }
  }
  //handle DELETE /api/users/:id
  else if (
    req.method == "DELETE" &&
    parthPart[1] === "api" &&
    parthPart[2] === "users" &&
    parthPart[3]
  ) {
    const userId = parseInt(parthPart[3]);
    const users = await readUsersFromFile();
    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex === -1) {
      sendJSON(res, 404, { error: "User not found" });
      return;
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    await saveUser(users);
    sendJSON(res, 200, {
      message: "User Deleted Successfully",
      user: deletedUser,
    });

    console.log(users);
  }
  // Handle GET /api/users/:id
  else if (
    req.method == "GET" &&
    parthPart[1] === "api" &&
    parthPart[2] === "users" &&
    parthPart[3]
  ) {
    const userId = parseInt(parthPart[3]);
    const users = await readUsersFromFile();

    const user = users.find((uid) => uid.id == userId);

    if (user) {
      sendJSON(res, 200, user);
    } else {
      sendJSON(res, 404, { error: "User not found" });
    }
  }

  //404 fallback API route
  else if (parthPart[1] === "api") {
    sendJSON(res, 404, { error: "API endpoint not found" });
  }
  //other routes
  else if (req.method === "GET" && req.url === "/") {
    await sendFile(res, join(__dirname, "views", "index.html"), "text/html");
  } else if (req.method === "GET" && req.url === "/about") {
    await sendFile(res, join(__dirname, "views", "about.html"), "text/html");
  } else if (req.method === "GET" && req.url === "/contact") {
    await sendFile(res, join(__dirname, "views", "contact.html"), "text/html");
  } else if (req.method === "GET" && req.url == "/css/style.css") {
    await sendFile(res, join(__dirname,"public", "css", "style.css"), "text/css");
  } else if (req.method === "GET" && req.url == "/js/main.js") {
    await sendFile(res, join(__dirname,"public", "js", "main.js"), "text/javascript");
  } else {
    sendHTML(res, 404, "<h1>404 Page Not Found</h1>");
  }
});

const port = process.env.PORT || 3000; //creating the port

//listening to the server
server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
