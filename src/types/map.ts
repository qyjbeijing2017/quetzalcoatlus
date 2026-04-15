import { QzaJSType, QzaType } from "../instance";
import { QzaMemory } from "../memory";
import { qzaPackageEnvironments } from "../package-environment";
import { QzaNull } from "./null";
import { QzaReference } from "./reference";

export abstract class QzaMap<K extends QzaType<any>, V extends QzaType<any>> extends QzaReference<[QzaJSType<K>, QzaJSType<V>][]> {
    abstract get keyType(): K;
    abstract get valueType(): V;

    get length(): number {
        if (this.size === 0) {
            return 0;
        }
        return this.size / (this.keyType.size + this.valueType.size);
    }

    get js(): [QzaJSType<K>, QzaJSType<V>][] {
        const result: [QzaJSType<K>, QzaJSType<V>][] = [];
        for (let i = 0; i < this.length; i++) {
            const [key, value] = this.at(i);
            result.push([key.js, value.js]);
        }
        return result;
    }

    set js(value: [QzaJSType<K>, QzaJSType<V>][]) {
        this.size = value.length * (this.keyType.size + this.valueType.size);
        for (let i = 0; i < value.length; i++) {
            const [k, v] = this.at(i);
            k.js = value[i][0];
            v.js = value[i][1];
        }
    }

    at(index: number): [InstanceType<K>, InstanceType<V>] {
        const address = this.refAddress + index * (this.keyType.size + this.valueType.size);
        const key = new this.keyType(undefined, this.memory, address) as InstanceType<K>;
        const value = new this.valueType(undefined, this.memory, address + this.keyType.size) as InstanceType<V>;
        return [key, value];
    }

    key(index: number): InstanceType<K> {
        if (index < 0 || index >= this.length) {
            throw new RangeError(`Index ${index} is out of bounds for map of length ${this.length}`);
        }
        const address = this.refAddress + index * (this.keyType.size + this.valueType.size);
        return new this.keyType(undefined, this.memory, address) as InstanceType<K>;
    }

    set(k: QzaJSType<K>, v: QzaJSType<V>): void {
        for (let i = 0; i < this.length; i++) {
            const [key, value] = this.at(i);
            if (key.js === k) {
                value.js = v;
                return;
            }
        }
        this.js = [...this.js, [k, v]];
    }

    get(k: QzaJSType<K>): InstanceType<V> | QzaNull {
        for (let i = 0; i < this.length; i++) {
            const [key, value] = this.at(i);
            if (key.js === k) {
                return value;
            }
        }
        return new QzaNull(undefined, this.memory);
    }

    clear(): void {
        this.js = [];
    }
}

export type QzaMapType<K extends QzaType<any>, V extends QzaType<any>> = {
    readonly size: 8;
    new(def?: [QzaJSType<K>, QzaJSType<V>][], memory?: QzaMemory, address?: number): QzaMap<K, V>;
}

export function qzaCreateMap<K extends QzaType<any>, V extends QzaType<any>>(keyType: K, valueType: V): QzaMapType<K, V> {
    return class extends QzaMap<K, V> {
        static readonly size = 8
        get keyType(): K {
            return keyType;
        }
        get valueType(): V {
            return valueType;
        }
    }
}
qzaPackageEnvironments['qzaCreateMap'] = qzaCreateMap;
