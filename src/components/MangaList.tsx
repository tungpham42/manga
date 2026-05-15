import React, { useState, useEffect } from "react";
import { List, Card, Typography, Spin, Button, Input } from "antd";
import {
  ReadOutlined,
  SyncOutlined,
  PictureOutlined,
  BookOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../api";

const { Title, Text } = Typography;
const { Search } = Input;

const MangaList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Server-Side Pagination States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchMangas = async () => {
    setLoading(true);
    try {
      const limit = 60;
      const offset = (currentPage - 1) * limit; // Calculate how many items to skip

      const params: any = {
        limit,
        offset,
        "includes[]": ["cover_art"],
        hasAvailableChapters: "true",
      };

      // If searching, add title query; otherwise, default to latest updated series
      if (searchQuery) {
        params.title = searchQuery;
      } else {
        params["order[updatedAt]"] = "desc";
      }

      const response = await api.get("/manga", { params });

      const formattedData = response.data.data.map((item: any) => {
        const coverRel = item.relationships.find(
          (r: any) => r.type === "cover_art",
        );
        return {
          id: item.id,
          mangaTitle:
            item.attributes.title?.en ||
            (item.attributes.title
              ? Object.values(item.attributes.title)[0]
              : "Unknown"),
          coverUrl: coverRel?.attributes?.fileName
            ? `https://uploads.mangadex.org/covers/${item.id}/${coverRel.attributes.fileName}.256.jpg`
            : null,
          status: item.attributes.status || "Unknown",
        };
      });

      setItems(formattedData);

      // MangaDex limits the offset maximum to 10,000 for public API usage.
      // We safely cap the total items so the pagination component doesn't break.
      const maxAllowedOffset = 10000;
      const actualTotal = response.data.total || 0;
      setTotalItems(Math.min(actualTotal, maxAllowedOffset + limit));
    } catch (error) {
      console.error("Failed to fetch mangas", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or search query changes
  useEffect(() => {
    fetchMangas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  // Handle a new Search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Always reset to page 1 on a fresh search
  };

  // Refresh or Reset view
  const handleRefresh = () => {
    if (searchQuery === "" && currentPage === 1) {
      fetchMangas(); // Force fetch if already on default home state
    } else {
      setSearchQuery(""); // Clear search and reset page
      setCurrentPage(1);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px" }}>
      <div className="dashboard-header">
        <Title
          level={2}
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {searchQuery ? (
            <>
              Search Results{" "}
              <SearchOutlined style={{ color: "var(--accent-primary)" }} />
            </>
          ) : (
            <>
              Cozy Manga Library{" "}
              <BookOutlined style={{ color: "var(--accent-primary)" }} />
            </>
          )}
        </Title>
        <div className="action-bar">
          <Search
            placeholder="Search comfy manga..."
            onSearch={handleSearch}
            allowClear
            size="large"
            className="search-bar"
          />
          <Button
            icon={<SyncOutlined />}
            onClick={handleRefresh}
            shape="round"
            className="refresh-btn"
            size="large"
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Spin size="large" />
          <div
            style={{
              marginTop: 16,
              color: "var(--accent-primary)",
              fontWeight: "bold",
            }}
          >
            Loading the shelves...
          </div>
        </div>
      ) : (
        <List
          grid={{ gutter: [24, 32], xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          dataSource={items}
          pagination={{
            current: currentPage,
            pageSize: 60,
            total: totalItems,
            showSizeChanger: false, // Keep it fixed at 60 for UI consistency
            align: "center",
            onChange: (page) => {
              setCurrentPage(page);
              // Scroll to the top of the page on clicking 'Next Page'
              window.scrollTo({ top: 0, behavior: "smooth" });
            },
          }}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                className="manga-card"
                cover={
                  <Link to={`/manga/${item.id}`}>
                    <div className="cover-wrapper">
                      {item.coverUrl ? (
                        <img
                          alt={item.mangaTitle}
                          src={item.coverUrl}
                          className="manga-cover"
                        />
                      ) : (
                        <div className="manga-cover-fallback">
                          <PictureOutlined style={{ fontSize: 40 }} />
                        </div>
                      )}
                    </div>
                  </Link>
                }
              >
                <div className="card-content">
                  <Text className="manga-title-text" title={item.mangaTitle}>
                    {item.mangaTitle}
                  </Text>

                  <div
                    className="meta-text"
                    style={{ textTransform: "capitalize" }}
                  >
                    <BookOutlined style={{ marginRight: 6 }} />
                    {item.status} Status
                  </div>

                  <Link to={`/manga/${item.id}`} style={{ marginTop: "auto" }}>
                    <Button
                      block
                      type="primary"
                      icon={<ReadOutlined />}
                      className="read-btn"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default MangaList;
