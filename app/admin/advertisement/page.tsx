"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Pencil } from "lucide-react";
import { GetAdvertisementsByAdmin } from "@/services/api";
import { toast } from "sonner";
import AdvertisementCreatingForm from "@/components/admin/advertisement/AdvertisementCreatingForm";
import AdvertisementEditingForm from "@/components/admin/advertisement/AdvertisementEditingForm";

export default function AdvertisementPage() {
  const [advertisements, setAdvertisements] = useState<IAdvertisement[] | null | undefined>();
  const [selectedSort, setSelectedSort] = useState("Mặc định");
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [advertisementToEdit, setAdvertisementToEdit] = useState<IAdvertisement | null>(null);

  const fetchAdvertisements = async () => {
    setIsLoading(true);
    try {
      let res = await GetAdvertisementsByAdmin();
      if (res.isSuccess && Number(res.statusCode) === 200) {
        if (res?.data) {
          let filteredData = [...res.data];
          
          // Apply search filter
          if (searchText) {
            filteredData = filteredData.filter(ad => 
              ad.title.toLowerCase().includes(searchText.toLowerCase()) ||
              ad.adTargetType.toLowerCase().includes(searchText.toLowerCase()) ||
              (ad.targetKey && ad.targetKey.toLowerCase().includes(searchText.toLowerCase()))
            );
          }
          
          // Apply sorting
          switch(selectedSort) {
            case "Mới nhất":
              filteredData.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
              break;
            case "Cũ nhất":
              filteredData.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
              break;
            case "Đang hoạt động":
              filteredData = filteredData.filter(ad => ad.isActive);
              break;
            case "Không hoạt động":
              filteredData = filteredData.filter(ad => !ad.isActive);
              break;
            case "Mặc định":
            default:
              // Keep original order
              break;
          }
          
          setAdvertisements(filteredData);
        }
      } else {
        const errorMessage = typeof res.message === 'string' ? res.message : "Không thể tải danh sách quảng cáo";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error fetching advertisements:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi tải danh sách quảng cáo";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Đã xảy ra lỗi khi tải danh sách quảng cáo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, [selectedSort, searchText]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Quản Lý Quảng Cáo</h1>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">          
            <Button
              className="w-full sm:w-auto sm:self-start bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              + Thêm Quảng Cáo Mới
            </Button>
          </div>        
        </div>

        {/* Table */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Danh Sách Quảng Cáo</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table Header - Hidden on mobile */}
            <div className="hidden lg:grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1.5fr_1.2fr] gap-3 px-4 py-3 text-sm font-semibold text-gray-500 border-b bg-white">
              <span className="text-left">Hình ảnh</span>
              <span className="text-left">Tiêu đề</span>
              <span className="text-left">Loại & Mục tiêu</span>
              <span className="text-center">Trạng thái</span>
              <span className="text-left">Thời gian</span>
              <span className="text-right">Hành động</span>
            </div>

            <div className="divide-y">
              {advertisements && advertisements.length > 0 ? (
                advertisements.map((ad) => (
                  <div key={ad.id}>
                    {/* Desktop Table Row */}
                    <div
                      className="hidden lg:grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1.5fr_1.2fr] gap-3 px-4 py-4 items-center bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-28 overflow-hidden rounded-lg border">
                          <Image 
                            src={ad.bannerUrl} 
                            alt={ad.title} 
                            fill 
                            className="object-cover" 
                            sizes="112px" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-semibold text-gray-900 truncate">{ad.title}</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 w-fit">
                          {ad.adTargetType}
                        </Badge>
                        {ad.targetKey && (
                          <span className="text-xs text-gray-600 truncate">{ad.targetKey}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        <Badge
                          variant={ad.isActive ? "default" : "secondary"}
                          className={ad.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"}
                        >
                          {ad.isActive ? "Đang hoạt động" : "Không hoạt động"}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Bắt đầu:</span> {formatDate(ad.startAt)}
                        </div>                      
                      </div>
                      <div className="flex items-center gap-2 justify-end">                      
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setAdvertisementToEdit(ad);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile/Tablet Card Layout */}
                    <div
                      className="lg:hidden p-4 bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <div className="flex gap-4">
                        <div className="relative h-24 w-32 sm:h-28 sm:w-36 flex-shrink-0 overflow-hidden rounded-lg border">
                          <Image 
                            src={ad.bannerUrl} 
                            alt={ad.title} 
                            fill 
                            className="object-cover" 
                            sizes="144px" 
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 flex-1">{ad.title}</h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-purple-200 text-purple-700 hover:bg-purple-50"
                                onClick={() => {
                                  toast.info("Tính năng xem chi tiết sẽ được thêm sau");
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setAdvertisementToEdit(ad);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={ad.isActive ? "default" : "secondary"}
                              className={`text-xs ${ad.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"}`}
                            >
                              {ad.isActive ? "Đang hoạt động" : "Không hoạt động"}
                            </Badge>
                            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 text-xs">
                              {ad.adTargetType}
                            </Badge>
                          </div>
                          {ad.targetKey && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                              <span className="font-medium">Mục tiêu:</span> {ad.targetKey}
                            </p>
                          )}
                          <div className="flex flex-col gap-1 pt-1">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Bắt đầu:</span> {formatDate(ad.startAt)}
                            </div>                           
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">Không tìm thấy quảng cáo nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Advertisement Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Tạo Quảng Cáo Mới</DialogTitle>
            </DialogHeader>

            <AdvertisementCreatingForm
              onSuccess={async () => {
                setIsCreateDialogOpen(false);
                // Refresh danh sách
                await fetchAdvertisements();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Advertisement Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Chỉnh Sửa Quảng Cáo</DialogTitle>
            </DialogHeader>
            {advertisementToEdit ? (
              <AdvertisementEditingForm
                advertisement={advertisementToEdit}
                onSuccess={async () => {
                  setIsEditDialogOpen(false);
                  setAdvertisementToEdit(null);
                  // Refresh danh sách
                  await fetchAdvertisements();
                }}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setAdvertisementToEdit(null);
                }}
              />
            ) : (
              <div className="py-8 text-center text-gray-500">
                Đang tải thông tin quảng cáo...
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
