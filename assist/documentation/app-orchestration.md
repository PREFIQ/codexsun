# App Operations

App Operations is the Super Admin runtime-maintenance surface for runnable repository apps.

## Repository Apps

- Platform: API `7010`, web `7020`; observable only because Platform cannot safely stop or restart itself.
- Core: API `7030`, web `7040`.
- Billing: API `7050`, web `7060`.
- Data Bridge: API `7090`, web `7100`.
- KitchenServe: API `7110`, web `7120`.

## Controls

- Refresh probes every registered port and records response time.
- Open & start opens a new visible PowerShell terminal and runs only the selected app's API and web services.
- Each API/Web service row has independent Start, Stop, and Restart controls with its own recorded terminal PID and managed uptime.
- Whole-app Open & start and Stop delegate to the two service-level lifecycles, allowing one service to restart without interrupting the other.
- Stop is available only when this Platform API process opened and recorded the terminal PID. It terminates that recorded Windows process tree.
- Update opens a separate visible terminal and runs root dependency installation followed by the selected API/web workspace typechecks.
- Update does not pull Git, reset files, deploy production, or modify databases.

Runtime PID tracking is intentionally process-local and service-specific. Restarting Platform API clears tracked ownership, so an old terminal must then be stopped manually. This prevents a fresh Platform process from killing an unrelated process based only on port ownership.
