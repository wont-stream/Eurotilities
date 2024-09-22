/**
 * 
 * @param {import("zerespluginlibrary").Plugin} Plugin 
 * @param {import("zerespluginlibrary").BoundAPI} Library 
 * @returns 
 */
module.exports = (Plugin, Library) => {

    const { Logger, Settings, DOMTools } = Library;

    return class extends Plugin {
        constructor() {
            super();

            this.defaultSettings = {};
            this.defaultSettings.noNitroUpsell = true;
            this.defaultSettings.colorSighted = true;
            this.defaultSettings.noTypingAnimation = true;
            this.defaultSettings.steamStatusSync = true;
        }

        // Plugin Main Functions

        onStart() {
            Logger.info("Plugin enabled!");

            global._eurotilities = {
                fixBD: this.getFixBD(),
                statusMap: this.getStatusMap(),
                steamStatusSync: this.getSteamStatusSyncFunction(),
            };

            if (this.settings.noNitroUpsell) {
                this.noNitroUpsell().start();
            }

            if (this.settings.colorSighted) {
                this.colorSighted().start();
            }

            if (this.settings.noTypingAnimation) {
                this.noTypingAnimation().start();
            }

            if (this.settings.steamStatusSync) {
                this.steamStatusSync().start();
            }
        }

        onStop() {
            Logger.info("Plugin disabled!");
        }

        getSettingsPanel() {
            return Settings.SettingPanel.build(this.saveSettings.bind(this),
                new Settings.SettingGroup("Modules").append(
                    new Settings.Switch("No Nitro Upsell", "Remove ALL of Discord's nitro upsells by tricking the client into thinking you have nitro.", this.settings.noNitroUpsell, (e) => { this.settings.noNitroUpsell = e; BdApi.Plugins.reload("Eurotilities") }),
                    new Settings.Switch("Color Sighted", "Remove the colorblind-friendly icons from statuses, just like 2015-2017 Discord.", this.settings.colorSighted, (e) => { this.settings.colorSighted = e; BdApi.Plugins.reload("Eurotilities") }),
                    new Settings.Switch("No Typing Animation", "Disable the CPU-intensive typing dots animation.", this.settings.noTypingAnimation, (e) => { this.settings.noTypingAnimation = e; BdApi.Plugins.reload("Eurotilities") }),
                    new Settings.Switch("Steam Status Sync", "Sync your Steam Status to your Discord Status.", this.settings.steamStatusSync, (e) => { this.settings.steamStatusSync = e; BdApi.Plugins.reload("Eurotilities") }),
                ),
            );
        }

        // Plugin Features

        noNitroUpsell() {
            const { DiscordModules } = Library;
            const { UserStore } = DiscordModules;
            const { getCurrentUser } = UserStore

            return {
                start: () => {
                    getCurrentUser()._eurotilities__premiumType = getCurrentUser().premiumType;
                    getCurrentUser().premiumType = 2;
                    return true;
                },
                stop: () => {
                    getCurrentUser().premiumType = getCurrentUser()._eurotilities__premiumType;
                    return true;
                },
            }
        }

        colorSighted() {
            const { addStyle, removeStyle } = DOMTools
            const { WebpackModules } = Library;
            const { Masks } = WebpackModules.getByProps("Masks");

            const masks = {
                online: Masks.STATUS_ONLINE,
                idle: Masks.STATUS_IDLE,
                dnd: Masks.STATUS_DND,
                offline: Masks.STATUS_OFFLINE,
                streaming: Masks.STATUS_STREAMING,
                onlineMobile: Masks.STATUS_ONLINE_MOBILE,
            }

            return {
                start: () => {
                    addStyle("_eurotilities-color-sighted", `[mask="url(#svg-mask-status-online)"] { height: 10; }`);
                    Masks.STATUS_DND = masks.online;
                    Masks.STATUS_IDLE = masks.online;
                    Masks.STATUS_OFFLINE = masks.online;
                    Masks.STATUS_STREAMING = masks.online;
                    Masks.STATUS_ONLINE_MOBILE = masks.online;
                    return true;
                },
                stop: () => {
                    removeStyle("_eurotilities-color-sighted");
                    Masks.STATUS_DND = masks.dnd;
                    Masks.STATUS_IDLE = masks.idle;
                    Masks.STATUS_OFFLINE = masks.offline;
                    Masks.STATUS_STREAMING = masks.streaming;
                    Masks.STATUS_ONLINE_MOBILE = masks.onlineMobile;
                    return true;
                },
            }
        }

        noTypingAnimation() {
            return {
                start: () => { document.hasFocus = () => { return false; }; return true },
                stop: () => false,
            }
        }

        steamStatusSync() {
            const { DiscordModules } = Library;
            const { Dispatcher } = DiscordModules;
            const { _subscriptions } = Dispatcher;
            const { USER_SETTINGS_PROTO_UPDATE } = _subscriptions;

            USER_SETTINGS_PROTO_UPDATE.add(this.getSteamStatusSyncFunction());

            return {
                start: () => USER_SETTINGS_PROTO_UPDATE.add(this.getSteamStatusSyncFunction()),
                stop: () => USER_SETTINGS_PROTO_UPDATE.remove(this.getSteamStatusSyncFunction()),
            }
        }

        // Utility functions

        getFixBD() {
            return {
                _: {
                    disableAll: (type) => {
                        const items = BdApi[type].getAll();
                        for (const item of items) {
                            BdApi[type].disable(item.id);
                        }
                    },
                    enableAll: (type) => {
                        const items = BdApi[type].getAll();
                        for (const item of items) {
                            BdApi[type].enable(item.id);
                        }
                    },
                    quickCss: () => {
                        document.getElementById("customcss").remove();
                    },
                },
                disable: {
                    plugins: () => fixBD._.disableAll("Plugins"),
                    themes: () => fixBD._.disableAll("Themes"),
                    quickcss: () => fixBD._.quickCss(),
                },
                enable: {
                    plugins: () => fixBD._.enableAll("Plugins"),
                    themes: () => fixBD._.enableAll("Themes"),
                },
                plugins: {
                    disable: () => fixBD._.disableAll("Plugins"),
                    enable: () => fixBD._.enableAll("Plugins"),
                },
                themes: {
                    disable: () => fixBD._.disableAll("Themes"),
                    enable: () => fixBD._.enableAll("Themes"),
                },
                quickcss: {
                    disable: () => fixBD._.quickCss(),
                },
            };
        }

        getStatusMap() {
            return {
                online: "online",
                idle: "away",
                dnd: "away",
                invisible: "invisible",
            };
        }

        getSteamStatusSyncFunction() {
            return (settingsUpdate) => {
                const protoStatus = settingsUpdate.settings.proto.status
                const discordStatus = protoStatus.status.value
                const showCurrentGame = protoStatus.showCurrentGame.value
                const steamStatus = this.getStatusMap()[discordStatus]

                if (!showCurrentGame) {
                    return open("steam://friends/status/invisible")
                }

                return open(`steam://friends/status/${steamStatus}`)
            }
        }
    };

};