import http from "node:http";
const users = [
  {
    name: "John Doe",
    id: 1,
    role: "Student",
  },
  {
    name: "joseph Prince",
    id: 2,
    role: "Student",
  },
  {
    name: "Christian Santos",
    id: 3,
    role: "Teacher",
  },
];
//creating the server
const server = http.createServer((req, res) => {
  console.log(req.method, req.url);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const parthPart = url.pathname.split("/");

  //Handle GET /api/users (list or filter)
  if (req.method === "GET" && url.pathname === "/api/users") {
    const role = url.searchParams.get("role");
    let filteredUsers = users;

    if (role) {
      filteredUsers = users.filter((user) => user.role === role);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(filteredUsers));
  }

  //Hanndle POST /api/users
  else if (req.method === "POST" && url.pathname === "/api/users") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const newUserData = JSON.parse(body);

        const newUser = {
          name: newUserData.name,
          id: users.length + 1,
          role: newUserData.role,
        };

        if (!newUser.name || !newUser.role) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "name and role are required fields" }),
          );
        }

        users.push(newUser);

        res.writeHead(201, { "content-type": "application/json" });

        res.end(
          JSON.stringify({
            message: "User Created Successfully",
            user: newUser,
          }),
        );
        console.log(users);
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON data" }));
      }

      req.on("error", (err)=>{
        res.writeHead(500, {"content-type":"application/json"});
        res.end(JSON.stringify({error:"internal server error"}));
      })




    });
  }

  //Handle PUT /api/users/:id
  else if (
    req.method == "PUT" &&
    parthPart[1] === "api" &&
    parthPart[2] === "users" &&
    parthPart[3]
  ) {
    const userId = parseInt(parthPart[3]);

    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const updatedUserData = JSON.parse(body);

        if (!newUser.name || !newUser.role) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "name and role are required fields" }),
          );
        }
        const userIndex = users.findIndex((user) => user.id === userId);

        if (userIndex === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "User not found" }));
          return;
        }

        users[userIndex] = {
          id: userId,
          name: updatedUserData.name,
          role: updatedUserData.role,
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "User Updated Successfully",
            user: users[userIndex],
          }),
        );

        console.log(users);
      } catch (error) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON data" }));
      }
    });
  }
  //handle DELETE /api/users/:id
  else if (
    req.method == "DELETE" &&
    parthPart[1] === "api" &&
    parthPart[2] === "users" &&
    parthPart[3]
  ) {
    const userId = parseInt(parthPart[3]);

    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex === -1) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        message: "User Deleted Successfully",
        user: deletedUser,
      }),
    );

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

    const user = users.find((uid) => uid.id == userId);

    if (user) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "User not found" }));
    }
  }

  //other routes
  else if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" }); //describe the response
    res.end("<h1>Home Page</h1>");
  } else if (req.method === "GET" && req.url === "/about") {
    res.writeHead(200, { "Content-Type": "text/html" }); //describe the response
    res.end("<h1>About Page</h1>");
  } else if (req.method === "GET" && req.url === "/contact") {
    res.writeHead(200, { "Content-Type": "text/html" }); //describe the response
    res.end("<h1>Contact Page</h1>");
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 Page Not Found</h1>");
  }
});

const port = 3000; //creating the port

//listening to the server
server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
