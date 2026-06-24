import { ChannelSelectMenuBuilder, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from "discord.js";
import { BaseSelectMenuOptions, ChannelSelectMenuOptions, MentionableSelectMenuOptions, RoleSelectMenuOptions, SELECT_MENU_OPTIONS_KEY, SELECT_MENU_TYPE_KEY, StringSelectMenuOptions, UserSelectMenuOptions } from "..";
import { Util } from "../../utils/Util";

/**
 * The base class for select menus created with the {@link StringSelectMenu}, {@link UserSelectMenu}, {@link RoleSelectMenu}, {@link ChannelSelectMenu}, and {@link MentionableSelectMenu} decorators. This class is used to create a select menu from the options defined in the class, and to override the default options with new options when creating the select menu.
 * 
 * @remarks
 * The select menu type is determined by the decorator used to create the select menu class, and can be one of the following:
 * - `string` for {@link StringSelectMenu}
 * - `user` for {@link UserSelectMenu}
 * - `role` for {@link RoleSelectMenu}
 * - `channel` for {@link ChannelSelectMenu}
 * - `mentionable` for {@link MentionableSelectMenu}
 * @example
 * ```ts
 * import { StringSelectMenuInteraction } from "discord.js";
 * import { StringSelectMenu, BaseSelectMenu, Interaction, Run } from "oopscord.js";
 * 
 * ＠StringSelectMenu({
 *     customId: "my_select_menu",
 *     options: [
 *         { label: "Option 1", value: "option_1" },
 *         { label: "Option 2", value: "option_2" },
 *         { label: "Option 3", value: "option_3" }
 *     ]
 * })
 * class MySelectMenu extends BaseSelectMenu {
 *     constructor(＠Interaction readonly interaction: StringSelectMenuInteraction) {
 *         super();
 *     }
 * 
 *     ＠Run
 *     async run() {
 *         await this.interaction.reply(`You selected: ${this.interaction.values.join(", ")}`);
 *     }
 * }
 * ```
 */
export class BaseSelectMenu {
    private static genericSelectMenu: GenericSelectMenu<SelectMenuKind>;
    private static options: BaseSelectMenuOptions;

    /** Returns a new {@link SelectMenuBuilder} that was created from the select menu options. */
    static getSelectMenu() {
        if (this.genericSelectMenu) return this.genericSelectMenu.copy();

        const type = Reflect.getMetadata(SELECT_MENU_TYPE_KEY, this) as SelectMenuKind;
        const options = Reflect.getMetadata(SELECT_MENU_OPTIONS_KEY, this) as BaseSelectMenuOptions;

        if (!options) throw new TypeError("Failed to get the select menu.");

        this.genericSelectMenu = new GenericSelectMenu(type);

        this.genericSelectMenu.create(options);

        this.options = options;

        return this.genericSelectMenu.copy();
    }

    /**
     * Returns a new {@link SelectMenuBuilder} with the specified options merged with the default options defined in the class, and the specified values merged with the default values defined in the class if the options include a `options` property (for StringSelectMenu) or `defaultUsers`/`defaultRoles`/`defaultChannels` property (for UserSelectMenu, RoleSelectMenu, ChannelSelectMenu, and MentionableSelectMenu).
     * 
     * @param options The options to merge with the default options.
     * @param values The component values to merge with the default components. The `customId` property is used to match the values with the correct components, and the `type` property is used to determine which type of component the value is for.
     */
    static override<K extends SelectMenuKind>(options: Partial<OptionsFromKind<K>> = {}, ...values: { label: string, value: string, description?: string, emoji?: string }[]): BuilderFor<K> {
        if (!this.genericSelectMenu) {
            this.getSelectMenu();
        }

        const currentOptions = (this.options ?? Reflect.getMetadata(SELECT_MENU_OPTIONS_KEY, this)) as OptionsFromKind<K>;

        if (!currentOptions) throw new TypeError("Failed to get the select menu options.");

        if (values.length > 0 && !this.genericSelectMenu.isStringSelect()) throw new TypeError("Values can only be overridden for StringSelectMenu.");

        const newOptions = values.length > 0 ? Util.mergeDefault(currentOptions, { ...options, options: values }) : Util.mergeDefault(currentOptions, options);

        return this.genericSelectMenu.create(newOptions) as BuilderFor<K>;
    }
}

interface SelectMenuMap {
    string: { builder: StringSelectMenuBuilder; options: StringSelectMenuOptions };
    user: { builder: UserSelectMenuBuilder; options: UserSelectMenuOptions };
    role: { builder: RoleSelectMenuBuilder; options: RoleSelectMenuOptions };
    channel: { builder: ChannelSelectMenuBuilder; options: ChannelSelectMenuOptions };
    mentionable: { builder: MentionableSelectMenuBuilder; options: MentionableSelectMenuOptions };
}

type SelectMenuKind = keyof SelectMenuMap;

const SelectMenuBuilders: { [K in SelectMenuKind]: new () => SelectMenuMap[K]['builder'] } = {
    string: StringSelectMenuBuilder,
    user: UserSelectMenuBuilder,
    role: RoleSelectMenuBuilder,
    channel: ChannelSelectMenuBuilder,
    mentionable: MentionableSelectMenuBuilder,
};

type OptionsFromKind<K extends SelectMenuKind> = SelectMenuMap[K]['options'];
type BuilderFor<K extends SelectMenuKind> = SelectMenuMap[K]['builder'];

class GenericSelectMenu<K extends SelectMenuKind> {
    public selectMenu: SelectMenuMap[K]['builder'] | null = null;

    constructor(public kind: K) {}

    isStringSelect(): this is GenericSelectMenu<"string"> { return this.kind === "string"; }
    isUserSelect(): this is GenericSelectMenu<"user"> { return this.kind === "user"; }
    isRoleSelect(): this is GenericSelectMenu<"role"> { return this.kind === "role"; }
    isChannelSelect(): this is GenericSelectMenu<"channel"> { return this.kind === "channel"; }
    isMentionableSelect(): this is GenericSelectMenu<"mentionable"> { return this.kind === "mentionable"; }

    create(this: GenericSelectMenu<"string">, options: StringSelectMenuOptions): StringSelectMenuBuilder;
    create(this: GenericSelectMenu<"user">, options: UserSelectMenuOptions): UserSelectMenuBuilder;
    create(this: GenericSelectMenu<"role">, options: RoleSelectMenuOptions): RoleSelectMenuBuilder;
    create(this: GenericSelectMenu<"channel">, options: ChannelSelectMenuOptions): ChannelSelectMenuBuilder;
    create(this: GenericSelectMenu<"mentionable">, options: MentionableSelectMenuOptions): MentionableSelectMenuBuilder;
    create(this: GenericSelectMenu<K>, options: OptionsFromKind<K>): BuilderFor<K>
    create(options: OptionsFromKind<K>) {
        const Builder = SelectMenuBuilders[this.kind];
        const menu = new Builder() as any;

        if (this.isStringSelect() && "options" in options) {
            menu.addOptions(options.options);
        } else if (this.isUserSelect() && "defaultUsers" in options) {
            menu.setDefaultUsers(options.defaultUsers ?? []);
        } else if (this.isRoleSelect() && "defaultRoles" in options) {
            menu.setDefaultRoles(options.defaultRoles ?? []);
        } else if (this.isChannelSelect() && "channelTypes" in options) {
            menu.setChannelTypes(options.channelTypes ?? [])
                .setDefaultChannels(options.defaultChannels ?? []);
        } else if (this.isMentionableSelect() && "defaultUsers" in options && "defaultRoles" in options) {
            menu.addDefaultUsers(options.defaultUsers ?? [])
                .addDefaultRoles(options.defaultRoles ?? []);
        }

        menu.setCustomId(options.customId);
        
        if (options.placeholder) menu.setPlaceholder(options.placeholder);
        if (options.disabled) menu.setDisabled(options.disabled);
        if (typeof options.minValues === 'number') menu.setMinValues(options.minValues);
        if (typeof options.maxValues === 'number') menu.setMaxValues(options.maxValues);

        this.selectMenu = menu;

        return (Builder as any).from(menu.toJSON());
    }

    copy() {
        if (!this.selectMenu) throw new TypeError("Select menu has not been created yet.");

        return (this.selectMenu.constructor as any).from(this.selectMenu.toJSON()) as BuilderFor<K>;
    }
}