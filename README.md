# n8n-nodes-pantrist

This is an [n8n](https://n8n.io) community node. It lets you use
[Pantrist](https://pantrist.app) in your n8n workflows.

Pantrist is a smart shopping list and pantry manager. This package wraps the
Pantrist REST API so you can manage your **lists**, **shopping list**,
**pantry**, and **barcode lookups** with clickable nodes instead of raw HTTP
requests — and react automatically when items change.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Trigger](#trigger)
[Example workflow](#example-workflow)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the
[installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
in the n8n community nodes documentation.

In short, from your n8n instance:

1. Go to **Settings → Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-pantrist` as the npm package name.
4. Agree that you understand the risks of installing community nodes and select
   **Install**.

After installation the **Pantrist** and **Pantrist Trigger** nodes are available
in the node panel.

## Credentials

You authenticate with a Pantrist **API key**.

1. Open the [Pantrist web app](https://pantrist.app) and sign in.
2. Go to **Settings** and generate a new **API key**. It looks like
   `<uuid>_<secret>` and is shown only once — copy it.
3. In n8n, create new **Pantrist API** credentials and paste the key into the
   **API Key** field.
4. Leave **Base URL** as `https://api.pantrist.app` unless you self-host
   Pantrist, in which case point it at your own instance.

The credential injects an `Authorization: Bearer <apiKey>` header on every
request and is verified by calling `GET /list`.

## Operations

### List

- **Get Many** – retrieve all of your lists (handy for finding a list's ID).

### Shopping List

- **Get Many** – retrieve the shopping-list items (optionally only those changed
  since a given timestamp via **Updated Since**).
- **Search** – search the shopping list by item name.
- **Add by Name** – add an item by name (e.g. `Milk`).
- **Add by Barcode** – add an item by barcode (e.g. `4006381333931`).
- **Check Off** – mark an item as checked off.
- **Delete** – remove an item.

### Pantry

- **Get Many** – retrieve the pantry items (optionally with **Updated Since**).
- **Add by Name** – add an item by name, with optional **Amount** (default `1`)
  and **Unit ID** (default `pieces`).
- **Add by Barcode** – add an item by barcode, with the same optional fields.
- **Change Amount** – change an item's amount by a **delta** (e.g. `-1` consumes
  one). Enable **Auto Restock** to add the article back to the shopping list
  when it drops to or below its configured minimum.
- **Delete** – remove an item.

### Barcode

- **Lookup** – look up product information for a barcode.

In every list/pantry operation, the **List Name or ID** field is a dropdown
populated from your account, so you pick a list by name instead of pasting a
UUID. The **Item ID** field expects the `uuid` of an item — typically wired in
from a previous node.

## Trigger

The **Pantrist Trigger** is a polling trigger. On the interval you configure it
checks a single list for changes and emits any items whose `lastModified`
timestamp is newer than the last poll.

Configure:

- **List Name or ID** – the list to watch.
- **Collection** – `Shopping List` or `Pantry List`.
- **Poll Times** – the standard n8n polling schedule.

How the cursor works:

- It polls `GET /list/{listId}/{collection}?updatedSince=<cursor>` and advances
  the cursor to the newest `lastModified` value it sees, persisting it in the
  workflow's static data.
- On the **first live run** the cursor starts at "now", so the trigger does not
  emit the entire existing list as if it had just changed — it only fires on
  subsequent changes.
- A **manual execution** (the *Test step* button) fetches the whole collection
  so you can see sample data, without moving the saved cursor.

> **Known limitation:** the trigger watches one chosen list, so it cannot detect
> a brand-new list being created account-wide. That would require a future
> account-level events endpoint or outbound webhooks.

## Example workflow

**Notify me when an item is checked off the shopping list.**

1. **Pantrist Trigger**
   - List Name or ID: *your list*
   - Collection: `Shopping List`
   - Poll Times: every minute (or your preference)
2. **IF** node
   - Condition: `{{ $json.checked }}` is `true`
     (use whichever field your list uses to mark an item as checked).
3. **Send notification** (Slack / Email / Telegram / …)
   - Message: `🛒 "{{ $json.name }}" was checked off your Pantrist list.`

Each time someone checks an item off, the trigger emits the changed item and the
downstream nodes fire your notification.

## Compatibility

- Requires n8n with `n8nNodesApiVersion` 1.
- Tested with Node.js 18+.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Pantrist](https://pantrist.app)

## License

[MIT](LICENSE)
