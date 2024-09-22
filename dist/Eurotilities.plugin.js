/**
 * @name Eurotilities
 * @description  A BetterDiscord plugin providing an opinionated collection of tweaks. 
 * @version 0.0.1
 * @author Seth
 * @authorId 1273447359417942128
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/
const config = {
    main: "index.js",
    id: "Eurotilities",
    name: "Eurotilities",
    author: "Seth",
    authorId: "1273447359417942128",
    version: "0.0.1",
    description: " A BetterDiscord plugin providing an opinionated collection of tweaks. "
};
class Dummy {
    constructor() {this._config = config;}
    start() {}
    stop() {}
}
 
if (!global.ZeresPluginLibrary) {
    BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.name ?? config.info.name} is missing. Please click Download Now to install it.`, {
        confirmText: "Download Now",
        cancelText: "Cancel",
        onConfirm: () => {
            require("request").get("https://betterdiscord.app/gh-redirect?id=9", async (err, resp, body) => {
                if (err) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                if (resp.statusCode === 302) {
                    require("request").get(resp.headers.location, async (error, response, content) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), content, r));
                    });
                }
                else {
                    await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                }
            });
        }
    });
}
 
module.exports = !global.ZeresPluginLibrary ? Dummy : (([Plugin, Api]) => {
     const plugin = (Plugin, Library) => {
    const { Logger, Settings, DOMTools } = Library;
    return class extends Plugin {
      constructor() {
        super();
        this.defaultSettings = {};
        this.defaultSettings.noNitroUpsell = !0;
        this.defaultSettings.colorSighted = !0;
        this.defaultSettings.noTypingAnimation = !0;
        this.defaultSettings.steamStatusSync = !0;
      }
      onStart() {
        Logger.info("Plugin enabled!");
        global._eurotilities = {
          fixBD: this.getFixBD(),
          statusMap: this.getStatusMap(),
          steamStatusSync: this.getSteamStatusSyncFunction()
        };
        if (this.settings.noNitroUpsell)
          this.noNitroUpsell().start();
        if (this.settings.colorSighted)
          this.colorSighted().start();
        if (this.settings.noTypingAnimation)
          this.noTypingAnimation().start();
        if (this.settings.steamStatusSync)
          this.steamStatusSync().start();
      }
      onStop() {
        Logger.info("Plugin disabled!");
      }
      getSettingsPanel() {
        return Settings.SettingPanel.build(this.saveSettings.bind(this), new Settings.SettingGroup("Modules").append(new Settings.Switch("No Nitro Upsell", "Remove ALL of Discord's nitro upsells by tricking the client into thinking you have nitro.", this.settings.noNitroUpsell, (e) => {
          this.settings.noNitroUpsell = e;
          BdApi.Plugins.reload("Eurotilities");
        }), new Settings.Switch("Color Sighted", "Remove the colorblind-friendly icons from statuses, just like 2015-2017 Discord.", this.settings.colorSighted, (e) => {
          this.settings.colorSighted = e;
          BdApi.Plugins.reload("Eurotilities");
        }), new Settings.Switch("No Typing Animation", "Disable the CPU-intensive typing dots animation.", this.settings.noTypingAnimation, (e) => {
          this.settings.noTypingAnimation = e;
          BdApi.Plugins.reload("Eurotilities");
        }), new Settings.Switch("Steam Status Sync", "Sync your Steam Status to your Discord Status.", this.settings.steamStatusSync, (e) => {
          this.settings.steamStatusSync = e;
          BdApi.Plugins.reload("Eurotilities");
        })));
      }
      noNitroUpsell() {
        const { DiscordModules } = Library, { UserStore } = DiscordModules, { getCurrentUser } = UserStore;
        return {
          start: () => {
            getCurrentUser()._eurotilities__premiumType = getCurrentUser().premiumType;
            getCurrentUser().premiumType = 2;
            return !0;
          },
          stop: () => {
            getCurrentUser().premiumType = getCurrentUser()._eurotilities__premiumType;
            return !0;
          }
        };
      }
      colorSighted() {
        const { addStyle, removeStyle } = DOMTools, { WebpackModules } = Library, { Masks } = WebpackModules.getByProps("Masks"), masks = {
          online: Masks.STATUS_ONLINE,
          idle: Masks.STATUS_IDLE,
          dnd: Masks.STATUS_DND,
          offline: Masks.STATUS_OFFLINE,
          streaming: Masks.STATUS_STREAMING,
          onlineMobile: Masks.STATUS_ONLINE_MOBILE
        };
        return {
          start: () => {
            addStyle("_eurotilities-color-sighted", '[mask="url(#svg-mask-status-online)"] { height: 10; }');
            Masks.STATUS_DND = masks.online;
            Masks.STATUS_IDLE = masks.online;
            Masks.STATUS_OFFLINE = masks.online;
            Masks.STATUS_STREAMING = masks.online;
            Masks.STATUS_ONLINE_MOBILE = masks.online;
            return !0;
          },
          stop: () => {
            removeStyle("_eurotilities-color-sighted");
            Masks.STATUS_DND = masks.dnd;
            Masks.STATUS_IDLE = masks.idle;
            Masks.STATUS_OFFLINE = masks.offline;
            Masks.STATUS_STREAMING = masks.streaming;
            Masks.STATUS_ONLINE_MOBILE = masks.onlineMobile;
            return !0;
          }
        };
      }
      noTypingAnimation() {
        return {
          start: () => {
            document.hasFocus = () => {
              return !1;
            };
            return !0;
          },
          stop: () => !1
        };
      }
      steamStatusSync() {
        const { DiscordModules } = Library, { Dispatcher } = DiscordModules, { _subscriptions } = Dispatcher, { USER_SETTINGS_PROTO_UPDATE } = _subscriptions;
        USER_SETTINGS_PROTO_UPDATE.add(this.getSteamStatusSyncFunction());
        return {
          start: () => USER_SETTINGS_PROTO_UPDATE.add(this.getSteamStatusSyncFunction()),
          stop: () => USER_SETTINGS_PROTO_UPDATE.remove(this.getSteamStatusSyncFunction())
        };
      }
      getFixBD() {
        return {
          _: {
            disableAll: (type) => {
              const items = BdApi[type].getAll();
              for (const item of items)
                BdApi[type].disable(item.id);
            },
            enableAll: (type) => {
              const items = BdApi[type].getAll();
              for (const item of items)
                BdApi[type].enable(item.id);
            },
            quickCss: () => {
              document.getElementById("customcss").remove();
            }
          },
          disable: {
            plugins: () => fixBD._.disableAll("Plugins"),
            themes: () => fixBD._.disableAll("Themes"),
            quickcss: () => fixBD._.quickCss()
          },
          enable: {
            plugins: () => fixBD._.enableAll("Plugins"),
            themes: () => fixBD._.enableAll("Themes")
          },
          plugins: {
            disable: () => fixBD._.disableAll("Plugins"),
            enable: () => fixBD._.enableAll("Plugins")
          },
          themes: {
            disable: () => fixBD._.disableAll("Themes"),
            enable: () => fixBD._.enableAll("Themes")
          },
          quickcss: {
            disable: () => fixBD._.quickCss()
          }
        };
      }
      getStatusMap() {
        return {
          online: "online",
          idle: "away",
          dnd: "away",
          invisible: "invisible"
        };
      }
      getSteamStatusSyncFunction() {
        return (settingsUpdate) => {
          const protoStatus = settingsUpdate.settings.proto.status, discordStatus = protoStatus.status.value, showCurrentGame = protoStatus.showCurrentGame.value, steamStatus = this.getStatusMap()[discordStatus];
          if (!showCurrentGame)
            return open("steam://friends/status/invisible");
          return open(`steam://friends/status/${steamStatus}`);
        };
      }
    };
  };
     return plugin(Plugin, Api);
})(global.ZeresPluginLibrary.buildPlugin(config));
/*@end@*/