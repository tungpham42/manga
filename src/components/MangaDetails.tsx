import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Spin, List, Button, Card, Row, Col } from "antd";
import { ArrowLeftOutlined, ReadOutlined } from "@ant-design/icons";
import api from "../api";

const { Title, Paragraph } = Typography;

const MangaDetails: React.FC = () => {
  const { mangaId } = useParams<{ mangaId: string }>();
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMangaAndChapters = async () => {
      setLoading(true);
      try {
        const mangaRes = await api.get(`/manga/${mangaId}`, {
          params: { "includes[]": ["cover_art"] },
        });

        const mangaData = mangaRes.data.data;
        const coverRel = mangaData.relationships.find(
          (r: any) => r.type === "cover_art",
        );
        const coverUrl = coverRel?.attributes?.fileName
          ? `https://uploads.mangadex.org/covers/${mangaId}/${coverRel.attributes.fileName}.512.jpg`
          : null;

        setManga({
          title:
            mangaData.attributes.title.en ||
            Object.values(mangaData.attributes.title)[0] ||
            "Unknown Title",
          description:
            mangaData.attributes.description.en || "No description available.",
          coverUrl,
        });

        const feedRes = await api.get(`/manga/${mangaId}/feed`, {
          params: {
            limit: 500,
            translatedLanguage: ["en"],
            "order[chapter]": "desc",
            includeFuturePublishAt: 0,
            includeEmptyPages: 0,
            includeExternalUrl: 0,
          },
        });

        const validChapters = feedRes.data.data.filter(
          (item: any) =>
            !item.attributes.externalUrl && item.attributes.pages > 0,
        );
        setChapters(validChapters);
      } catch (error) {
        console.error("Failed to fetch manga details or chapters", error);
      } finally {
        setLoading(false);
      }
    };

    if (mangaId) fetchMangaAndChapters();
  }, [mangaId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
        <div
          style={{
            color: "var(--accent-primary)",
            marginTop: "16px",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          Unpacking the cozy chapters...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Link to="/">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          style={{
            color: "var(--text-muted)",
            marginBottom: 24,
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Back to Dashboard
        </Button>
      </Link>

      <Row gutter={[32, 32]}>
        {/* Left Column: Cover Image */}
        <Col xs={24} md={8} lg={6}>
          <Card
            cover={
              manga?.coverUrl ? (
                <img
                  alt="cover"
                  src={manga.coverUrl}
                  style={{ width: "100%" }}
                />
              ) : (
                <div
                  style={{
                    padding: "100px 0",
                    textAlign: "center",
                    background: "#FFE4D6",
                    color: "var(--accent-primary)",
                    fontWeight: "bold",
                  }}
                >
                  No Cover
                </div>
              )
            }
            styles={{ body: { display: "none" } }}
            style={{
              borderRadius: "24px",
              overflow: "hidden",
              border: "none",
              boxShadow: "var(--card-shadow)",
            }}
          />
        </Col>

        {/* Right Column: Info & Chapter List */}
        <Col xs={24} md={16} lg={18}>
          <Title
            level={1}
            style={{ color: "var(--text-main)", marginTop: 0, fontWeight: 800 }}
          >
            {manga?.title}
          </Title>
          <Paragraph
            style={{
              color: "var(--text-muted)",
              fontSize: "16px",
              lineHeight: "1.8",
              fontWeight: 500,
            }}
          >
            {manga?.description}
          </Paragraph>

          <Title
            level={3}
            style={{
              color: "var(--text-main)",
              marginTop: 40,
              borderBottom: "2px dashed rgba(255, 140, 105, 0.3)",
              paddingBottom: 12,
              fontWeight: 800,
            }}
          >
            Chapters ({chapters.length})
          </Title>

          <List
            itemLayout="horizontal"
            dataSource={chapters}
            pagination={{
              pageSize: 20,
              style: { textAlign: "center", marginTop: 24 },
            }}
            renderItem={(chapter) => (
              <List.Item
                style={{
                  borderBottom: "1px solid rgba(255, 140, 105, 0.1)",
                  padding: "20px 0",
                }}
                actions={[
                  <Link to={`/read/${chapter.id}`}>
                    <Button
                      type="primary"
                      shape="round"
                      icon={<ReadOutlined />}
                      style={{
                        background: "var(--accent-primary)",
                        border: "none",
                        fontWeight: "bold",
                        boxShadow: "0 4px 10px rgba(255, 140, 105, 0.3)",
                      }}
                    >
                      Read
                    </Button>
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span
                      style={{
                        color: "var(--text-main)",
                        fontSize: "18px",
                        fontWeight: 700,
                      }}
                    >
                      Chapter {chapter.attributes.chapter || "?"}
                      {chapter.attributes.title &&
                        ` - ${chapter.attributes.title}`}
                    </span>
                  }
                  description={
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 500 }}
                    >
                      Uploaded on{" "}
                      {new Date(
                        chapter.attributes.publishAt,
                      ).toLocaleDateString()}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </div>
  );
};

export default MangaDetails;
