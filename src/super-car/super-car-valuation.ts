import axios from 'axios';

import { VehicleValuation } from '../models/vehicle-valuation';
import { SuperCarValuationResponse } from './types/super-car-valuation-response';

export async function fetchValuationFromSuperCarValuation(
  vrm: string,
  mileage: number,
): Promise<VehicleValuation> {
  axios.defaults.baseURL =
    'https://run.mocky.io/v3/f656eafd-c903-43f9-860d-4c90f8d3e143';
  const response = await axios.get<SuperCarValuationResponse>(
    `valuations/${vrm}?mileage=${mileage}`,
  );

  const valuation = new VehicleValuation();

  valuation.vrm = vrm;
  valuation.lowestValue = response.data.valuation.lowerValue;
  valuation.highestValue = response.data.valuation.upperValue;
  valuation.provider = 'SuperCar'

  return valuation;
}
