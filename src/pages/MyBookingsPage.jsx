import HeroNavBar from "../components/HeroNavBar";
import MyBookingsTab from "../components/MyBookingsTab";

export default function MyBookingsPage() {
  return (
    <>
      <HeroNavBar variant="normal" />
      <div style={{ paddingTop: "6rem", maxWidth: "800px", margin: "0 auto" }}>
        <MyBookingsTab />
      </div>
    </>
  );
}
