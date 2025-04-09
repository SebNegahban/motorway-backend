import { VehicleValuation } from "@app/models/vehicle-valuation";
import { FastifyInstance } from "fastify";
import { InsertResult, Repository } from "typeorm";

export default class ValuationRepository {
  repository: Repository<VehicleValuation>;

  constructor(fastify: FastifyInstance){
    this.repository = fastify.orm.getRepository(VehicleValuation);
  }

  async findOneByVrm(vrm: string): Promise<VehicleValuation | null> {
    return this.repository.findOneBy({vrm: vrm})
  }

  async createValuation(valuation: VehicleValuation): Promise<void>{
    await this.repository.insert(valuation).catch((err) => {
      if (err.code !== 'SQLITE_CONSTRAINT') {
        throw err;
      }
    });
  }
}