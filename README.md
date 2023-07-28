## SACN Scene Recorder

💡 This webb application is used to record sACN scenes and play them back using HTP merge. Features:

-   Unlimited number of scenes.
-   Scenes can be renamed, color-coded, categorized and reordered.
-   Faders can be enabled on a per-scene basis.
-   Per-scene fade time.
-   Multiple universes.
-   Control via Website UI, WebSockets or MQTT. BitFocus companion (including feedback) is supported via WebSockets.

The project uses Next.js, but with a custom Express.js server to enable the sACN, WebSockets, and MQTT services to run simultaneously. Tailwind is used for styling. State in the back end is managed through redux and stored in a sqlite3 database.

## Yarn commands

Run the development server using:

```
yarn dev
```

Initiate the database using:

```
yarn migrate
```

Format the code before commiting with:

```
yarn format
```

To build and start the server (for deployment):

```
yarn build
yarn start
```

## Configuration

Available configuration i _.env.local_:

```
NEXT_PUBLIC_HOST=[IP or Hostname, for example "localhost"]
NEXT_PUBLIC_CATEGORIES_JSON=[JSON list of categories, for example '["Category 1", "Category 2"]']
NEXT_PUBLIC_UNIVERSES_JSON=[JSON list of categories, for example '[1,2,3,4]']
NEXT_PUBLIC_PRIO=[Prio as number, for example 90]
PORT=[HTTP Port as number, for example 80]
NEXT_PUBLIC_WEBSOCKETS_PORT=[Websockets Port as number, for example 8000]

MQTT_TOPIC=[MQTT Topic for this service, optional]
MQTT_BROKER=[MQTT broker url including mqtt protocol, optional]
MQTT_SOURCE_ID=[MQTT source id for use in messages, optional]
```
