import { ClientEvents, ClientOptions } from "discord.js";
import { DICSORD_MODULE_OPTIONS_KEY, INTERNAL_EVENTS_KEY, MODULE_TYPE_KEY } from "./Constants";
import { Listener } from "../components/Listener";

export interface ModuleOptions extends ClientOptions {
    token: string;
    imports: (new (...args: any[]) => any)[];
    commands?: (new (...args: any[]) => any)[];
    components?: (new (...args: any[]) => any)[];
    listeners?: typeof Listener[];
    test?: {
        enable: boolean,
        guild: null | string
    };
    disableCache?: boolean;
}

/**
 * Default configuration options for Discord modules.
 */
export const defaultModuleOptions: ModuleOptions = {
    token: "",
    imports: [],
    commands: [],
    components: [],
    listeners: [],
    test: {
        enable: false,
        guild: null,
    },
    disableCache: false,
    intents: []
}

export interface DiscordModuleEvents {
    eventName: keyof ClientEvents;
    methodName: string;
}

// export interface ExternalModuleEvents {
//     eventName: string;
//     methodName: string;
//     eventEmitter: EventEmitter;
// }

/**
 * Decorator that marks a class as a Discord module.
 * 
 * @param option1 - The configuration options for the module
 * @returns A decorator function that applies module metadata to the target class
 * 
 * @throws {TypeError} If any of the imported modules are not valid Discord modules
 */
export function DiscordModule(option1: ModuleOptions) {
    return function<TFunction extends Function>(constructor: TFunction) {
        const options = mergeDefault(defaultModuleOptions, option1);

        options.imports.forEach(module => {
            if (typeof Reflect.getMetadata(MODULE_TYPE_KEY, module) != "number") throw new TypeError(`${module.name} is not a module.`);
        });

        Reflect.defineMetadata(DICSORD_MODULE_OPTIONS_KEY, options, constructor);
    }
}

// export function ExternalEventHandler(eventName: string, eventEmitter: EventEmitter): MethodDecorator {
//     return function<T>(target: Object, propertyKey: string | symbol, propertyDescriptor: TypedPropertyDescriptor<T>) {
//         const events: ExternalModuleEvents[] = Reflect.getMetadata(DISCORD_MODULE_EXTERNAL_EVENTS_KEY, target) ?? [];

//         events.push({ eventName, methodName: propertyKey as string, eventEmitter });

//         Reflect.defineMetadata(DISCORD_MODULE_EXTERNAL_EVENTS_KEY, events, target.constructor);
//     }
// }

function mergeDefault<T extends { [key: string | symbol]: any }>(def: T, given: T) {
    if (!given) return def;
    for (const key in def) {
        if (!Object.hasOwn(given, key) || given[key] === undefined) {
            given[key] = def[key];
        } else if (given[key] === Object(given[key])) {
            given[key] = mergeDefault(def[key], given[key]);
        }
    }

    return given;
}