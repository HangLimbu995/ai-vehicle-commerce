import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/helper";
import React, { useState, useEffect } from "react";

const EMICalculator = ({ carPrice }) => {
  const [price, setPrice] = useState(carPrice || 10000);
  const [downPayment, setDownPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(5); // in years
  const [emi, setEmi] = useState(0);
  const [totalAmountPaid, setTotalAmountPaid] = useState(0);
  const [totalInterestPaid, setTotalInterestPaid] = useState(0);

  useEffect(() => {
    // Ensure down payment does not exceed car price
    if (downPayment > price) {
      setDownPayment(price);
    }
    calculateEmi();
  }, [price, downPayment, interestRate, loanTerm]);

  const calculateEmi = () => {
    const principal = price - downPayment;
    const monthlyInterestRate = interestRate / 12 / 100;
    const numberOfPayments = loanTerm * 12;

    if (principal <= 0 || numberOfPayments <= 0 || monthlyInterestRate <= 0) {
      setEmi(0);
      return;
    }

    const emiValue =
      principal *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, numberOfPayments) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    setEmi(emiValue);

    const totalPaid = emiValue * numberOfPayments;
    setTotalAmountPaid(totalPaid);
    setTotalInterestPaid(totalPaid - principal);
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="price" className="mb-3 block">
              Vehicle Price: {formatCurrency(price)}
            </Label>
            <Slider
              id="price"
              min={5000}
              max={100000}
              step={1000}
              value={[price]}
              onValueChange={(val) => setPrice(val[0])}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="downPayment" className="mb-3 block">
              Down Payment: {formatCurrency(downPayment)}
            </Label>
            <Slider
              id="downPayment"
              min={0}
              max={price}
              step={500}
              value={[downPayment]}
              onValueChange={(val) => setDownPayment(val[0])}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="interestRate" className="mb-3 block">
              Interest Rate:
            </Label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                id="interestRateInput"
                type="number"
                min={0.1}
                max={20}
                step={0.1}
                value={interestRate.toFixed(2)}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-24 text-center"
              />
              <span className="text-lg font-semibold">%</span>
            </div>
            <Slider
              id="interestRateSlider"
              min={0.1}
              max={20}
              step={0.1}
              value={[interestRate]}
              onValueChange={(val) => setInterestRate(val[0])}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="loanTerm" className="mb-3 block">
              Loan Term:
            </Label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                id="loanTermInput"
                type="number"
                min={1}
                max={7}
                step={1}
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-24 text-center"
              />
              <span className="text-lg font-semibold">
                {loanTerm === 1 ? "year" : "years"}
              </span>
            </div>
            <Slider
              id="loanTermSlider"
              min={1}
              max={7}
              step={1}
              value={[loanTerm]}
              onValueChange={(val) => setLoanTerm(val[0])}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-8 p-5 bg-blue-50 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-blue-800">
            Estimated Monthly Payment
          </h3>
          <p className="text-5xl font-extrabold text-blue-600 mt-3">
            {formatCurrency(emi)}
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Total Loan Amount: {formatCurrency(price - downPayment)}
          </p>

          <div className="mt-4 pt-4 flex justify-between items-start">
            <div className="text-left">
              <p className="text-xl font-bold text-blue-600 opacity-80">
                {formatCurrency(totalAmountPaid)}
              </p>
              <p className="text-xs text-gray-500">Total Payable</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600 opacity-80">
                {formatCurrency(totalInterestPaid)}
              </p>
              <p className="text-xs text-gray-500">Total Interest</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMICalculator;
