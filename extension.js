const Me = imports.misc.extensionUtils.getCurrentExtension();
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const { Clutter, St, GObject, Pango, Gio } = imports.gi;

const HOME_ICON = 'go-home';
const WORKSPACE_ICON = 'computer';
const ADD_ICON = 'list-add-symbolic';

let WorkspaceIndicator = GObject.registerClass(
    class WorkspaceIndicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('Horizontal workspace indicator'));

            this._settings = ExtensionUtils.getSettings();

            this._container = new St.Widget({
                layout_manager: new Clutter.BinLayout(),
                x_expand: true,
                y_expand: true,
                style_class: "widget",
            });

            this.add_actor(this._container);

			this._box = new St.BoxLayout({
				vertical: false,
				style_class: 'workspace-indicator-box',
			});
			this._container.add_actor(this._box);

            let workspaceManager = global.workspace_manager;
            this._workspaceManagerSignals = [
                workspaceManager.connect_after('notify::n-workspaces',
                    this.update.bind(this)),
                workspaceManager.connect_after('workspace-switched',
                    this.update.bind(this)),
            ];

			this._icons = [];

			for (let i = 0; i < workspaceManager.n_workspaces; i++) {
				this._icons.push(new St.Icon({
					icon_name: HOME_ICON,
					style_class: 'system-status-icon',
				}));

				this._box.add_actor(this._icons[i]);

				this.setHomeIcon(workspaceManager, i);
			}

			this.setPlusIcon(workspaceManager);
        }

		// setHomeIcon set the HOME_ICON to current workspace, otherwise set WORKSPACE_ICON.
		//
		// @param workspaceManager Meta.WorkspaceManager.
		// @param workspaceIndex number.
		setHomeIcon(workspaceManager, workspaceIndex) {
			if (workspaceManager.get_active_workspace().index() === workspaceIndex) {
				this._icons[workspaceIndex].set_icon_name(HOME_ICON);
			} else {
				this._icons[workspaceIndex].set_icon_name(WORKSPACE_ICON);
			}
		}

		// setPlusIcon set the ADD_ICON to the last workspace.
		//
		// @param workspaceManager Meta.WorkspaceManager.
		setPlusIcon(workspaceManager) {
			this._icons[this._icons.length-1].set_icon_name(ADD_ICON);
		}

        update() {
			log("update");
            let workspaceManager = global.workspace_manager;
			log(this._icons.length);
			log(workspaceManager.n_workspaces);
			if (this._icons.length < workspaceManager.n_workspaces) {
				log("enter on condition");
				this._icons.push(new St.Icon({
					icon_name: WORKSPACE_ICON,
					style_class: 'system-status-icon',
				}));
				this._box.add_actor(this._icons[this._icons.length-1]);
			}

			if (this._icons.length > workspaceManager.n_workspaces) {
				this._box.remove_actor(this._icons[this._icons.length-1]);
				this._icons.pop();
			}

			for (let i = 0; i < this._icons.length; i++) {
				this.setHomeIcon(workspaceManager, i);
			}

			this.setPlusIcon(workspaceManager);
        }

        destroy() {
            for (let i = 0; i < this._workspaceManagerSignals.length; i++)
                workspaceManager.disconnect(this._workspaceManagerSignals[i])
            super.destroy();
        }
    }
);

function getWidgetIndex(position) {
    if (position === "right") {
        return 0
    } 

    return 1
}

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }
    
    enable() {
        this._indicator = new WorkspaceIndicator();
        let widgetPosition = this._indicator._settings.get_value("widget-position").unpack();
        Main.panel.addToStatusArea(this._uuid, this._indicator, getWidgetIndex(widgetPosition), widgetPosition);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
