# homebridge-technoline-mobile-alerts-switch

Experimental plugin to connect technoline mobile alerts switches (MA10880) to homebridge. If you want more details on how it is build, read [this blog article](https://medium.com/@tobilarscheid/ma-10880-switches-with-homekit-aka-reverse-engineering-a-binary-api-68f3b20761df).

## Setup

The technoline gateway needs to be configured to send all requests through your homebridge instance. Use the official mobile alerts app, go to settings > gateway > configure and enter your homebridge's IP as the proxy IP. The default port to use is 8000, but you can change it in the config.

## Configuration

Every panel you configure spawns 4 buttons in your Homekit App. Each button's name is concatenated from the panel name plus the respective entry in the buttons array.

```json
{
    "bridge": {
        "name": "Homebridge",
        "username": "CC:22:3D:E3:CE:30",
        "port": 51826,
        "pin": "031-45-154"
    },
    "platforms": [
        {
            "platform": "ma10880-switch-platform",
            "name": "ma10880-platform",
            "port": "<optional, default is 8000>",
            "panels": [
                {
                    "id": "<hex id printed on the back of your keypad>",
                    "name": "My Keypad",
                    "buttons": [
                        "Green",
                        "Orange",
                        "Red",
                        "Yellow"
                    ]
                }
            ]
        }
    ]
}
```