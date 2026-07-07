"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMonths, createMonth } from "@/lib/api";
import { setStockNavSource } from "@/lib/stock-nav";
import CreateMonthModal from "@/components/stocks/CreateMonthModal";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CurrentStockPage() {
  const router = useRouter();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [months, setMonths] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    year: currentYear,
    month: currentMonth,
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const monthExists = months.some(
    (m) => m.year === formData.year && m.month === formData.month,
  );

  useEffect(() => {
    getMonths()
      .then((data) => {
        setMonths(data);
        const match = data.find(
          (m) => m.year === currentYear && m.month === currentMonth,
        );
        if (match) {
          setStockNavSource("stock-mgt");
          router.replace(`/stock/${currentYear}/${match.id}`);
        }
      })
      .catch((err) => {
        setLoadError(err.message || "Failed to load months");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, currentYear, currentMonth]);

  useEffect(() => {
    const shouldShowToast = sessionStorage.getItem("show_login_toast");

    if (shouldShowToast === "true") {
      toast.success("Login Successful!");
      sessionStorage.removeItem("show_login_toast");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (monthExists) {
      toast.error("This year and month already exists!");
      return;
    }

    try {
      setSaving(true);
      const resultData = await createMonth({
        month: formData.month,
        year: formData.year,
      });

      closeModal();
      setStockNavSource("stock-mgt");

      router.replace(`/stock/${formData.year}/${resultData.id}`);
    } catch (err) {
      toast.error(err.message || "Failed to create month");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600 text-center max-w-md">{loadError}</p>
      </div>
    );
  }

  const hasCurrentMonth = months.some(
    (m) => m.year === currentYear && m.month === currentMonth,
  );

  if (hasCurrentMonth) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative p-8 flex flex-col items-center justify-center min-h-screen  bg-linear-to-br bg-slate-200   selection:bg-blue-500/10 gap-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Stock Management
        </h1>
        <p className="text-gray-600">
          No stock record for{" "}
          <span className="font-semibold">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          . Create a month to start managing stock.
        </p>
      </div>

      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Create Month</span>
      </button>

      <CreateMonthModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        monthNames={monthNames}
        currentYear={currentYear}
        monthExists={monthExists}
        saving={saving}
      />
    </div>
  );
}
