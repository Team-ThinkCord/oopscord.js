import { ClientEvents, ClientOptions } from "discord.js";
import { DICSORD_MODULE_OPTIONS_KEY, DISCORD_MODULE_INTERNAL_EVENTS_KEY, MODULE_TYPE_KEY } from "./Constants";

export interface ModuleOptions extends ClientOptions {
    token: string;
    imports: (new (...args: any[]) => any)[];
    test?: {
        enable: boolean,
        guild: null | string
    };
    disableCache?: boolean;
}

export const defaultModuleOptions: ModuleOptions = {
    token: "",
    imports: [],
    test: {
        enable: false,
        guild: null as string | null,
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

export function DiscordModule(option1: ModuleOptions) {
    return function<TFunction extends Function>(constructor: TFunction) {
        const options = mergeDefault(defaultModuleOptions, option1);

        options.imports.forEach(module => {
            if (typeof Reflect.getMetadata(MODULE_TYPE_KEY, module) != "number") throw new TypeError(`${module.name} is not a module.`);
        });

        Reflect.defineMetadata(DICSORD_MODULE_OPTIONS_KEY, options, constructor);
    }
}

export function EventHandler(eventName: keyof ClientEvents): MethodDecorator {
    return function<T>(target: Object, propertyKey: string | symbol, propertyDescriptor: TypedPropertyDescriptor<T>) {
        const events: DiscordModuleEvents[] = Reflect.getMetadata(DISCORD_MODULE_INTERNAL_EVENTS_KEY, target) ?? [];

        events.push({ eventName, methodName: propertyKey as string });

        Reflect.defineMetadata(DISCORD_MODULE_INTERNAL_EVENTS_KEY, events, target.constructor);
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