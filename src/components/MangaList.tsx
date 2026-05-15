import React, { useState, useEffect } from "react";
import { List, Card, Typography, Spin, Button, Input } from "antd";
import {
  ReadOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../api";

const { Title, Text } = Typography;
const { Search } = Input;

const MangaList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const fetchLatestChapters = async () => {
    setLoading(true);
    setIsSearchMode(false);
    try {
      const response = await api.get("/chapter", {
        params: {
          limit: 40,
          "order[publishAt]": "desc",
          "includes[]": ["manga"],
          translatedLanguage: ["en"],
          includeFuturePublishAt: 0,
          includeEmptyPages: 0,
          includeExternalUrl: 0,
        },
      });

      const validChapters = response.data.data
        .filter(
          (item: any) =>
            !item.attributes.externalUrl && item.attributes.pages > 0,
        )
        .slice(0, 18);

      const mangaIds = Array.from(
        new Set(
          validChapters
            .map(
              (item: any) =>
                item.relationships.find((rel: any) => rel.type === "manga")?.id,
            )
            .filter(Boolean),
        ),
      );

      const coversMap: Record<string, string> = {};
      if (mangaIds.length > 0) {
        const mangaParams = new URLSearchParams();
        mangaParams.append("limit", "100");
        mangaIds.forEach((id) => mangaParams.append("ids[]", id as string));
        mangaParams.append("includes[]", "cover_art");

        const mangaRes = await api.get("/manga", { params: mangaParams });
        mangaRes.data.data.forEach((m: any) => {
          const coverRel = m.relationships.find(
            (r: any) => r.type === "cover_art",
          );
          if (coverRel?.attributes?.fileName) {
            coversMap[m.id] =
              `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}.256.jpg`;
          }
        });
      }

      const formattedData = validChapters.map((item: any) => {
        const mangaRel = item.relationships.find(
          (rel: any) => rel.type === "manga",
        );
        const titleObj = mangaRel?.attributes?.title;
        const mId = mangaRel?.id;

        return {
          type: "chapter",
          id: item.id,
          mangaId: mId,
          chapterNum: item.attributes.chapter,
          chapterTitle: item.attributes.title,
          publishAt: item.attributes.publishAt,
          mangaTitle:
            titleObj?.en ||
            (titleObj ? Object.values(titleObj)[0] : null) ||
            "Unknown Manga",
          coverUrl: mId ? coversMap[mId] : null,
        };
      });

      setItems(formattedData);
    } catch (error) {
      console.error("Failed to fetch chapters", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query) return fetchLatestChapters();

    setLoading(true);
    setIsSearchMode(true);
    try {
      const response = await api.get("/manga", {
        params: {
          title: query,
          limit: 18,
          "includes[]": ["cover_art"],
          hasAvailableChapters: "true",
        },
      });

      const formattedData = response.data.data.map((item: any) => {
        const coverRel = item.relationships.find(
          (r: any) => r.type === "cover_art",
        );
        const coverUrl = coverRel?.attributes?.fileName
          ? `https://uploads.mangadex.org/covers/${item.id}/${coverRel.attributes.fileName}.256.jpg`
          : null;

        return {
          type: "manga",
          id: item.id,
          mangaTitle:
            item.attributes.title.en ||
            Object.values(item.attributes.title)[0] ||
            "Unknown",
          description:
            item.attributes.description?.en?.substring(0, 80) + "...",
          coverUrl,
        };
      });
      setItems(formattedData);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestChapters();
  }, []);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div className="dashboard-header">
        <div>
          <Title
            level={2}
            style={{ color: "var(--text-main)", margin: 0, fontWeight: 800 }}
          >
            {isSearchMode ? "Search Results 🕵️‍♀️" : "Latest Cozy Drops ☕"}
          </Title>
          <Text style={{ color: "var(--text-muted)", fontSize: "16px" }}>
            {isSearchMode
              ? "Found these lovely gems matching your query!"
              : "Freshly translated chapters, perfectly warmed up for you."}
          </Text>
        </div>

        <div className="action-bar">
          <Search
            placeholder="Search for comfy manga..."
            onSearch={handleSearch}
            allowClear
            size="large"
            className="search-bar"
          />
          {!isSearchMode && (
            <Button
              type="primary"
              size="large"
              shape="round"
              icon={<SyncOutlined />}
              onClick={fetchLatestChapters}
              className="refresh-btn"
            >
              Refresh List
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
          <div
            style={{
              color: "var(--accent-primary)",
              marginTop: "16px",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            Gathering the fluffiest pages...
          </div>
        </div>
      ) : (
        <List
          grid={{ gutter: [24, 32], xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          dataSource={items}
          renderItem={(item) => (
            <List.Item>
              <Card
                className="manga-card"
                hoverable
                cover={
                  <Link
                    to={`/manga/${item.type === "chapter" ? item.mangaId : item.id}`}
                    style={{ display: "block" }}
                  >
                    <div className="cover-wrapper">
                      {item.coverUrl ? (
                        <img
                          alt={item.mangaTitle}
                          src={item.coverUrl}
                          className="manga-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="manga-cover-fallback">
                          <PictureOutlined
                            style={{ fontSize: "40px", opacity: 0.5 }}
                          />
                        </div>
                      )}
                      {item.type === "chapter" && (
                        <div className="chapter-badge">
                          Ch. {item.chapterNum || "?"}
                        </div>
                      )}
                    </div>
                  </Link>
                }
              >
                {/* Rest of your card content remains exactly the same */}
                <div className="card-content">
                  <Link
                    to={`/manga/${item.type === "chapter" ? item.mangaId : item.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Text
                      style={{
                        color: "var(--text-main)",
                        fontWeight: 800,
                        fontSize: "16px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginBottom: "12px",
                        lineHeight: "1.3",
                      }}
                      title={item.mangaTitle}
                    >
                      {item.mangaTitle}
                    </Text>
                  </Link>

                  {item.type === "chapter" ? (
                    <>
                      <div className="meta-text">
                        <ClockCircleOutlined style={{ marginRight: "6px" }} />
                        {new Date(item.publishAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </div>
                      <Link
                        to={`/read/${item.id}`}
                        style={{ marginTop: "auto" }}
                      >
                        <Button
                          block
                          type="primary"
                          className="read-btn"
                          icon={<ReadOutlined />}
                        >
                          Read Now
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={`/manga/${item.id}`}
                      style={{ marginTop: "auto" }}
                    >
                      <Button
                        block
                        type="primary"
                        className="read-btn gradient-btn"
                        icon={<ReadOutlined />}
                        shape="round"
                      >
                        View Chapters
                      </Button>
                    </Link>
                  )}
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
