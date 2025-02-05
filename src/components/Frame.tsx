"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";
import { Loader2 } from "lucide-react";

import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";

function TokenInfoCard({ contractAddress }: { contractAddress: string }) {
  const { data: name, isLoading: nameLoading } = useReadContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: "name",
  });

  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: "symbol",
  });

  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: "decimals",
  });

  const { data: totalSupply, isLoading: supplyLoading } = useReadContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: "totalSupply",
  });

  const isLoading = nameLoading || symbolLoading || decimalsLoading || supplyLoading;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Token Information</CardTitle>
        <CardDescription>{truncateAddress(contractAddress)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div>
              <Label>Name:</Label>
              <p className="font-medium">{name || "N/A"}</p>
            </div>
            <div>
              <Label>Symbol:</Label>
              <p className="font-medium">{symbol || "N/A"}</p>
            </div>
            <div>
              <Label>Decimals:</Label>
              <p className="font-medium">{decimals?.toString() || "N/A"}</p>
            </div>
            <div>
              <Label>Total Supply:</Label>
              <p className="font-medium">
                {totalSupply?.toString() || "N/A"}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [contractAddress, setContractAddress] = useState("");
  const [submittedAddress, setSubmittedAddress] = useState("");
  const [inputError, setInputError] = useState("");

  const handleSubmit = () => {
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setInputError("Invalid Ethereum address");
      return;
    }
    setInputError("");
    setSubmittedAddress(contractAddress);
  };

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) return;

      setContext(context);
      sdk.actions.ready({});
      
      sdk.on("frameAdded", ({ notificationDetails }) => {
        setSubmittedAddress("");
      });

      const store = createStore();
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
      });
    };
    
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      paddingTop: context?.client.safeAreaInsets?.top ?? 0,
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
      paddingRight: context?.client.safeAreaInsets?.right ?? 0,
    }}>
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-neutral-900">
          {PROJECT_TITLE}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Enter Token Contract Address</CardTitle>
            <CardDescription>
              Paste any ERC-20 contract address below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full"
            />
            {inputError && <p className="text-red-500 text-sm">{inputError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="w-full">
                Get Token Info
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setContractAddress("");
                  setSubmittedAddress("");
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {submittedAddress && (
          <TokenInfoCard contractAddress={submittedAddress} />
        )}
      </div>
    </div>
  );
}
