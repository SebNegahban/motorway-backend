import { fastify } from '~root/test/fastify';
import { VehicleValuationRequest } from '../types/vehicle-valuation-request';

const mocks = vi.hoisted(() => {
  return {
    findOneByVrmMock: vi.fn(),
    superCarValuationResponse: vi.fn(),
    premiumCarValuationResponse: vi.fn(),
  }
})

vi.mock('@app/data/valuation-repository', () => {
  return {
    default: vi.fn().mockReturnValue({
      findOneByVrm: mocks.findOneByVrmMock,
      createValuation: vi.fn()
    })
  }
})    

vi.mock('@app/super-car/super-car-valuation', () => {
  return {
    fetchValuationFromSuperCarValuation: mocks.superCarValuationResponse
  }
})

vi.mock('@app/premium-car/premium-car-valuation', () => {
  return {
    fetchValuationFromPremiumCarValuation: mocks.premiumCarValuationResponse
  }
})

describe('ValuationController (e2e)', () => {
  describe('GET /valuations/', () => {
    it('should return a 404 if the valuation is not found', async () => {
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      mocks.findOneByVrmMock.mockResolvedValue(null)
      
      expect(res.statusCode).toStrictEqual(404);
    })

    it('should return a valuation if one is found', async () => {
      const valuation = {highestValue: 10, lowestValue: 0, vrm: 'ABC123'}
      mocks.findOneByVrmMock.mockResolvedValue(valuation)
      
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });


      expect(res.statusCode).toEqual(200)
    })
  })  
  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations',
        method: 'PUT',
        body: requestBody,
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/12345678',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        // @ts-expect-error intentionally malformed payload
        mileage: null,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is negative', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 with valid request', async () => {
      mocks.superCarValuationResponse.mockResolvedValue({
        vrm: 'ABC123',
        lowestValue: 0,
        highestValue: 10,
        midpointValue: 5,
        provider: 'SuperCar'
      })
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
    });

    it('should return an existing valuation if one exists', async () => {
      const valuation = {
        vrm: 'ABC123',
        lowestValue: 0,
        highestValue: 10,
        midpointValue: 5,
        provider: 'SuperCar'
      }
      mocks.findOneByVrmMock.mockResolvedValue(valuation)
      mocks.superCarValuationResponse.mockRejectedValue({})
      mocks.premiumCarValuationResponse.mockRejectedValue({})

      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });
      
      expect(JSON.parse(res.body)).toEqual(valuation)
    })
  });
});
