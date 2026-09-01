import { Landing } from "@/components/site/landing";
import { CATALOG_SIZE, CATALOG_VERIFIED_ON, getPriceList } from "@/lib/catalog";
import "./site.css";

export default function Home() {
  return (
    <Landing
      rows={getPriceList()}
      modelCount={CATALOG_SIZE}
      verifiedOn={CATALOG_VERIFIED_ON}
    />
  );
}
