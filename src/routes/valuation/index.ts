import { FastifyInstance } from 'fastify';
import { VehicleValuationRequest } from './types/vehicle-valuation-request';
import ValuationRepository from '@app/data/valuation-repository';
import ValuationCalculator from '@app/services/valuation-calculator';

export function valuationRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const { vrm } = request.params;
    const valuationRepository = new ValuationRepository(fastify)

    if (vrm === null || vrm === '' || vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    const result = await valuationRepository.findOneByVrm(vrm);

    if (result == null) {
      return reply
        .code(404)
        .send({
          message: `Valuation for VRM ${vrm} not found`,
          statusCode: 404,
        });
    }

    return result;
  });

  fastify.put<{
    Body: VehicleValuationRequest;
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const { vrm } = request.params;
    const { mileage } = request.body;
    const valuationRepository = new ValuationRepository(fastify)
    const valuationCalculator = new ValuationCalculator()

    if (vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    if (mileage === null || mileage <= 0) {
      return reply
        .code(400)
        .send({
          message: 'mileage must be a positive number',
          statusCode: 400,
        });
    }

    const existingValuation = await valuationRepository.findOneByVrm(vrm)

    if(existingValuation){
      return existingValuation
    }
    
    const newValuation = await valuationCalculator.getValue(vrm, mileage).catch((error) => {
      return reply.code(error.cause?.code || 500).send(
        { message: error.message, statusCode: error.cause?.code || 500 }
      )   
    })

    // Save to DB.
    if(newValuation){
      
      await valuationRepository.createValuation(newValuation)
      fastify.log.info('Valuation created: ', newValuation);

      return newValuation;
    }
  });
}
