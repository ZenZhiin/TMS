Objective
Design and build a backend for a ticketing system that allows event organizers to create
events and users to purchase/reserve tickets.
Requirements
🔧 Functionality
● A complete OpenAPI 3.x specification file (openapi.yaml or openapi.json) that
reflects a functional and documented Swagger UI.
● Core Entities:
○ Event
○ Venue
○ Ticket
○ Order
● Optional: Use the OpenAPI spec to generate a backend scaffold using an LLM
(e.g.,Gemini, ChatGPT, Copilot, etc.), This should be done in one prompt can be saved
in file called PROMPT_BUILD.md
📌 Technical Requirements
● Use Node.js and TypeScript (NodeJs 22+ preferred).
○ Preferred: NestJs
● Use proper storage if applicable.
● Containerize the application using Docker.
● Full coverage Unit testing
● Deploy to a cloud provider (Google Cloud) and provide a working swagger URL.
🎁 Bonus (Optional but Appreciated)
● Event seats allocations (reserved seating)
○ CRUD for a UI that will show seat availability

🤖 AI Usage
● Use of AI tools (e.g., ChatGPT, GitHub Copilot, etc.) is encouraged to help speed up
development, write boilerplate code, or suggest optimizations.
● If you use AI, please include the prompt(s) you used to generate any major part of the
project (e.g., controller logic, integration setup, test scaffolding, Dockerfile, etc.) in your
PROMPT_BUILD.md.

📦 Deliverables
● Create a project in our GitLab for the whole project and files.
● ✅ README.md
containing:
○ Setup instructions
○ How to run and test the API
○ Example requests (cURL/Postman)
○ Any configuration notes (e.g., where to place the API key)
● ✅ Unit test results
