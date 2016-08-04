import _ from 'underscore';

import * as Tools from '../helpers/tools';

export default class Hash {
  constructor(client, key, { parse, stringify } = {}) {
    this.client = client;
    this.key = key;
    this.parse = Tools.selectParser(parse);
    this.stringify = Tools.selectStringifier(stringify);
  }

  fullKey(subkey, separator) {
    return this.key + (subkey ? `${separator || ':'}${subkey}` : '');
  }

  async getOne(id, subkey) {
    let data = await this.client.hget(this.fullKey(subkey), id);
    return this.parse(data);
  }

  async getSome(ids, subkey) {
    if (!ids || !_(ids).isArray() || ids.length <= 0) {
      return [];
    }
    let data = await this.client.hmget.call(this.client, this.fullKey(subkey), ...ids);
    return data.map(this.parse);
  }

  async getAll(subkey) {
    let data = await this.client.hgetall(this.fullKey(subkey));
    return _(data).mapObject(this.parse);
  }

  async exists(subkey) {
    let exists = await this.client.exists(this.fullKey(subkey));
    return !!exists;
  }

  async existsOne(id, subkey) {
    let exists = await this.client.hexists(this.fullKey(subkey), id);
    return !!exists;
  }

  async setOne(id, data, subkey) {
    return await this.client.hset(this.fullKey(subkey), id, this.stringify(data));
  }

  async deleteOne(id) {
    return await this.client.hdel(this.fullKey(subkey), id);
  }

  async keys() {
    return await this.client.hkeys(this.fullKey(subkey));
  }

  async find(query, subkey) {
    query = (typeof query !== 'undefined') ? `:${query}` : ':*';
    return await this.client.keys(this.fullKey(subkey) + query);
  }
}
