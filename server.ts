import { sql, serve } from "bun";
import homepage from "./index.html";

const server = serve({
  routes: {
    "/": homepage,

    "/api/users": {
      async GET(req) {
        const users = await sql`SELECT * FROM users`;
        return Response.json(users);
      },
      async POST(req) {
        const { name, email } = await req.json();
        const [user] =
          await sql`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
        return Response.json(user);
      },
    },
  },

  development: true,

  async fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);