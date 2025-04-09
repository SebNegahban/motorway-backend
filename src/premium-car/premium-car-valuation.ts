import { VehicleValuation } from "@app/models/vehicle-valuation";
import axios from "axios";
import { PremiumCarValuationResponse } from "./types/premium-car-valuation-response";
import { XMLParser } from "fast-xml-parser";

export async function fetchValuationFromPremiumCarValuation(
  vrm: string,
): Promise<VehicleValuation>{
  axios.defaults.baseURL = 'https://run.mocky.io/v3/2bf9a150-258e-4912-8d3f-7f7f77cf0f0f';
  const response = await axios.get(`valueCar?vrm=${vrm}`, {responseType: 'document'})
  const valuation = new VehicleValuation()

  const data: PremiumCarValuationResponse = new XMLParser().parse(response.data).root

  valuation.vrm = vrm,
  valuation.lowestValue = data.ValuationDealershipMaximum
  valuation.highestValue = data.ValuationDealershipMinimum
  valuation.provider = 'PremiumCar'

  return valuation
}