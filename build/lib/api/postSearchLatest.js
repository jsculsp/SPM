"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const _ = require("underscore");
const Database_1 = require("../Database");
const SpmPackageVersion_1 = require("../entity/SpmPackageVersion");
const ApiBase_1 = require("../ApiBase");
const SpmPackage_1 = require("../entity/SpmPackage");
class PostSearchLatest extends ApiBase_1.ApiBase {
    constructor() {
        super();
        this.method = 'post';
        this.uri = '/v1/search_latest';
        this.type = 'application/json; charset=utf-8';
    }
    paramsValidate(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = ctx.request.body;
            if (!params.packageName || _.isEmpty(params.packageName)) {
                throw new Error('packageName is required!');
            }
        });
    }
    handle(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let params = ctx.request.body;
                // 查询 spmPackage
                const spmPackage = yield Database_1.default.instance().conn
                    .getRepository(SpmPackage_1.SpmPackage)
                    .findOne({ name: params.packageName });
                if (!spmPackage) {
                    return this.buildResponse(`package ${params.packageName} does not exist.`, -1);
                }
                let sheetName = 'version';
                let spmPackageVersion;
                if (!params.major) {
                    // 如果查询参数有 major，则查询 minor 和 patch 最高的版本
                    spmPackageVersion = yield Database_1.default.instance().conn
                        .getRepository(SpmPackageVersion_1.SpmPackageVersion)
                        .createQueryBuilder(sheetName)
                        .where(`${sheetName}.pid = :pid`, { pid: spmPackage.id })
                        .orderBy(`${sheetName}.major`, 'DESC')
                        .addOrderBy(`${sheetName}.minor`, 'DESC')
                        .addOrderBy(`${sheetName}.patch`, 'DESC')
                        .getOne();
                }
                else {
                    // 如果查询参数没有 major，则查询 major，minor 和 patch 均为最高的版本
                    spmPackageVersion = yield Database_1.default.instance().conn
                        .getRepository(SpmPackageVersion_1.SpmPackageVersion)
                        .createQueryBuilder(sheetName)
                        .where(`${sheetName}.pid = :pid`, { pid: spmPackage.id })
                        .andWhere(`${sheetName}.major = :major`, { major: params.major })
                        .orderBy(`${sheetName}.minor`, 'DESC')
                        .addOrderBy(`${sheetName}.patch`, 'DESC')
                        .getOne();
                }
                if (!spmPackageVersion) {
                    return this.buildResponse(`package ${params.packageName} does not exist.`, -1);
                }
                return this.buildResponse(`${spmPackageVersion.major}.${spmPackageVersion.minor}.${spmPackageVersion.patch}`);
            }
            catch (err) {
                return this.buildResponse(err.message, -1);
            }
        });
    }
    ;
}
exports.api = new PostSearchLatest();
