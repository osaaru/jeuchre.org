# jeuchre.org

Jeuchre is a card game that you can think of as the anti-Euchre: the goal is to **lose**
tricks. Invented by Julian Paas and his sons during the 2020 pandemic, stewarded by the
(informal) Jeuchre Foundation. This repo contains the jeuchre.org website and, eventually,
the browser game.

**Status:** ground-up rebuild in progress — see [PLAN.md](PLAN.md) for the full plan and
decision record. The previous implementation lives on the `archive/gatsby-2020` branch.

## Layout

| Path | What |
|---|---|
| `apps/site` | Astro 7 site (content pages + game island) |
| `packages/engine` | Pure-TypeScript jeuchre rules engine |
| `packages/bots` | Heuristic bot policies + coach reasoning |
| `packages/ui-game` | React card-table components |

## Developing

Requires [proto](https://moonrepo.dev/proto). Then:

```sh
proto install
pnpm install
moon check --all     # build/test/lint/typecheck everything
moon site:dev        # run the site locally
```

Contributions: issues are open to everyone; small PRs welcome — please open an issue before
building anything big. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licensing

- **Code:** [MIT](LICENSE)
- **Content** (rules text, images, site prose): [CC BY-SA 4.0](LICENSE-content.md) —
  play it, share it, adapt it, credit jeuchre.org and share alike.
