# CODEXSUN Hosted Runtime

The hosted Platform web application is a static production build served by nginx. The compiled Platform API is the
only supervised Node.js process. Do not proxy production traffic to Vite or run `npm run dev` as a hosted service.

These checked-in files target the current host layout:

- Repository: `/home/sundar/codexsun`
- Runtime user: `sundar`
- Platform API: `127.0.0.1:7010`
- Published web root: `/var/www/codexsun`

## Build and publish

Run from the repository root after pulling a verified release:

```sh
npm ci
npm run build -w @codexsun/framework
npm run build -w @codexsun/platform-api
npm run build -w @codexsun/platform-web

sudo install -d -o www-data -g www-data /var/www/codexsun
sudo rsync -a --delete dist/apps/platform/web/ /var/www/codexsun/
```

Platform Vite reads client variables from the root `.env`. Production should set `VITE_PLATFORM_API_URL` to
`/api/platform` so browser requests stay on the hosted origin. `PLATFORM_WEB_PORT` is dev-only and is not required by
the production build.

## Install process supervision and nginx

```sh
sudo install -m 0644 deploy/hosted/systemd/codexsun-platform-api.service \
  /etc/systemd/system/codexsun-platform-api.service
sudo install -m 0644 deploy/hosted/nginx/codexsun.conf /etc/nginx/sites-available/codexsun
sudo ln -sfn /etc/nginx/sites-available/codexsun /etc/nginx/sites-enabled/codexsun
sudo rm -f /etc/nginx/sites-enabled/default

sudo systemctl daemon-reload
sudo systemctl enable --now codexsun-platform-api
sudo nginx -t
sudo systemctl reload nginx
```

## Deploy an update

After rebuilding and publishing the static files:

```sh
sudo systemctl restart codexsun-platform-api
sudo nginx -t
sudo systemctl reload nginx
```

## Verify

```sh
systemctl is-active codexsun-platform-api nginx
curl --fail --silent --show-error http://127.0.0.1/api/platform/health
curl --silent --output /dev/null --write-out '%{http_code}\n' \
  http://127.0.0.1/api/platform/auth/session
curl --fail --silent --show-error http://127.0.0.1/ >/dev/null
journalctl -u codexsun-platform-api -n 100 --no-pager
```

Expected unauthenticated status: health `200`, session `401`, and web root `200`.
