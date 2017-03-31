import { IAdapter, IDataSource } from './Interfaces';
import { isEqual, get } from 'lodash';

type IDataSubscriber = (data: any) => any;
type IErrorSubscriber = (error: any) => any;

function shouldExecuteAfm(afm) {
    return get(afm, 'measures.length') > 0 || get(afm, 'attributes.length') > 0;
}

export class DataTable {
    private adapter: IAdapter;

    private dataSubscribers: IDataSubscriber[] = [];
    private errorSubscribers: IErrorSubscriber[] = [];

    private afm;

    private dataSource: IDataSource;

    constructor(adapter: IAdapter) {
        this.adapter = adapter;
    }

    public getData(afm, transformation) {
        if (!shouldExecuteAfm(afm)) {
            return;
        }

        if (!isEqual(afm, this.afm)) {
            this.afm = afm;
            this.dataSource = this.adapter.createDataSource(afm);
        }

        this.fetchData(transformation);
    }

    public execute(afm, transformation) {
        if (!shouldExecuteAfm(afm)) {
            return Promise.resolve(null);
        }

        if (!isEqual(afm, this.afm)) {
            this.afm = afm;
            this.dataSource = this.adapter.createDataSource(afm);
        }

        return this.dataSource.getData(transformation);
    }

    public onData(callback) {
        this.dataSubscribers.push(callback);
    }

    public onError(callback) {
        this.errorSubscribers.push(callback);
    }

    public resetDataSubscribers() {
        this.dataSubscribers = [];
        return this;
    }

    public resetErrorSubscribers() {
        this.errorSubscribers = [];
        return this;
    }

    private fetchData(transformation) {
        this.dataSource.getData(transformation)
            .then((result) => this.dataSubscribers.forEach((handler) => handler(result)))
            .catch((error) => this.errorSubscribers.forEach((handler) => handler(error)));
        return this;
    }
}