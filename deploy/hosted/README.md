# CODEXSUN Hosted Runtime

The hosted Platform web application is a static production build served by nginx. The compiled Platform API is the
only supervised Node.js process. Do not proxy production traffic to Vite or run `npm run dev` as a hosted service.

These checked-in files target the current host layout:

- Repository: `/home/sundar/codexsun`
- Runtime user: `sundar`
- Platform API: `127.0.0.1:7010`
- Platform web root: `/var/www/codexsun-platform`
- CODEXSUN site root: `/var/www/sites/codexsun`
- LogicX site root: `/var/www/sites/logicx`
- Tech Media site root: `/var/www/sites/techmedia`

The maintained nginx configuration maps `codexsun.com`, `logicx.in`, and `techmedia.in` to their independent Sites
artifacts. `app.codexsun.com` and unmatched tenant domains serve Platform; Platform then resolves the request hostname
through its tenant-domain module.

## Generate the server GitHub key

Generate a temporary ED25519 keypair under the server repository's ignored `.temp` directory:

```sh
npm run github:ssh-key -- --comment "codexsun-server"
```

Add the printed public key under the repository's GitHub **Settings > Deploy keys** and enable write access only when
the server must push commits. Never add or copy the private key into the repository. Install the generated pair using
the exact temporary paths printed by the command:

```sh
install -d -m 700 ~/.ssh
install -m 600 /home/sundar/codexsun/.temp/github-ssh-key-XXXXXX/github_codexsun ~/.ssh/github_codexsun
install -m 644 /home/sundar/codexsun/.temp/github-ssh-key-XXXXXX/github_codexsun.pub ~/.ssh/github_codexsun.pub
```

Replace `XXXXXX` with the generated directory name. Then add this host entry to `~/.ssh/config`:

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_codexsun
  IdentitiesOnly yes
```

After the public key is registered in GitHub, verify and switch the repository remote:

```sh
chmod 600 ~/.ssh/config
ssh -T git@github.com
git remote set-url origin git@github.com:PREFIQ/codexsun.git
```

## Build and publish

Run from the repository root after pulling a verified release:

```sh
npm ci
npm run build -w @codexsun/framework
npm run build -w @codexsun/platform-api
npm run build -w @codexsun/platform-web
npm run build -w @codexsun/sites-web

sudo install -d -o www-data -g www-data \
  /var/www/codexsun-platform \
  /var/www/sites/codexsun \
  /var/www/sites/logicx \
  /var/www/sites/techmedia
sudo rsync -a --delete dist/apps/platform/web/ /var/www/codexsun-platform/
sudo rsync -a --delete dist/apps/sites/web/codexsun/ /var/www/sites/codexsun/
sudo rsync -a --delete dist/apps/sites/web/logicx/ /var/www/sites/logicx/
sudo rsync -a --delete dist/apps/sites/web/techmedia/ /var/www/sites/techmedia/
```

Platform Vite reads client variables from the root `.env`. Production should set `VITE_PLATFORM_API_URL` to
`/api/platform` so browser requests stay on the hosted origin. Set
`VITE_PLATFORM_WEB_ORIGIN=https://app.codexsun.com` before building Sites so public-site login and application links
leave the marketing domains for Platform. `PLATFORM_WEB_PORT` is dev-only and is not required by the production build.

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

Verify each HTTP hostname before enabling TLS:

```sh
curl --resolve codexsun.com:80:127.0.0.1 --fail http://codexsun.com/ >/dev/null
curl --resolve logicx.in:80:127.0.0.1 --fail http://logicx.in/ >/dev/null
curl --resolve techmedia.in:80:127.0.0.1 --fail http://techmedia.in/ >/dev/null
curl --resolve app.codexsun.com:80:127.0.0.1 --fail \
  http://app.codexsun.com/api/platform/health
```

## Connect live domains

Point the public DNS `A` records for `codexsun.com`, `logicx.in`, `techmedia.in`, and `app.codexsun.com` to the
server. Add matching `www` CNAME records where required. After DNS resolves, install certificates:

```sh
sudo certbot --nginx -d codexsun.com -d www.codexsun.com
sudo certbot --nginx -d logicx.in -d www.logicx.in
sudo certbot --nginx -d techmedia.in -d www.techmedia.in
sudo certbot --nginx -d app.codexsun.com
```

For a live tenant hostname, point its DNS to the same server, add the exact hostname to Platform Tenant Domains, and
issue a certificate for it. The default nginx Platform server can serve the tenant workspace without creating a new
frontend build; tenant selection remains database-backed and fails closed when the hostname is not registered.
