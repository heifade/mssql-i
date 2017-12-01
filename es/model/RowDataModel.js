"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RowDataModel {
    static create(source) {
        let data = new RowDataModel();
        Reflect.ownKeys(source).map(key => {
            let v = Reflect.get(source, key);
            Reflect.set(data, key, v);
        });
        return data;
    }
    get(key) {
        return Reflect.get(this, key);
    }
    set(key, value) {
        Reflect.set(this, key, value);
        return this;
    }
    has(key) {
        return Reflect.has(this, key);
    }
    keys() {
        return Reflect.ownKeys(this);
    }
}
exports.RowDataModel = RowDataModel;
//# sourceMappingURL=RowDataModel.js.map