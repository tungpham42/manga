import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Spin, Button, Result, Space } from "antd";
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import api from "../api";

const MangaReader: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  const [images, setImages] = useState<string[]>([]);
  const [mangaId, setMangaId] = useState<string | null>(null);
  const [mangaTitle, setMangaTitle] = useState<string | null>(null);

  // Navigation states
  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchChapterData = async () => {
      setLoading(true);
      setError(false);
      setPrevChapterId(null);
      setNextChapterId(null);

      try {
        // Fetch both the page images and the chapter metadata
        const [atHomeRes, chapterRes] = await Promise.all([
          api.get(`/at-home/server/${chapterId}`),
          api.get(`/chapter/${chapterId}`, {
            params: { "includes[]": ["manga"] },
          }),
        ]);

        // 1. Process images
        const { baseUrl, chapter } = atHomeRes.data;
        const { hash, data } = chapter;
        const imageUrls = data.map(
          (filename: string) => `${baseUrl}/data/${hash}/${filename}`,
        );
        setImages(imageUrls);

        // 2. Extract Manga ID and Title from chapter relationships
        const mangaRel = chapterRes.data.data.relationships.find(
          (rel: any) => rel.type === "manga",
        );

        if (mangaRel) {
          const fetchedMangaId = mangaRel.id;
          setMangaId(fetchedMangaId);

          const titleObj = mangaRel.attributes?.title;
          const title =
            titleObj?.en ||
            (titleObj ? Object.values(titleObj)[0] : "Unknown Manga");
          setMangaTitle(title as string);

          // 3. Fetch chapter feed to figure out Next / Previous chapters
          const feedRes = await api.get(`/manga/${fetchedMangaId}/feed`, {
            params: {
              limit: 500,
              translatedLanguage: ["en"],
              "order[chapter]": "asc", // Ascending order to easily find prev/next
              includeFuturePublishAt: 0,
              includeEmptyPages: 0,
              includeExternalUrl: 0,
            },
          });

          const validChapters = feedRes.data.data.filter(
            (item: any) =>
              !item.attributes.externalUrl && item.attributes.pages > 0,
          );

          // Find current chapter index to set neighbors
          const currentIndex = validChapters.findIndex(
            (c: any) => c.id === chapterId,
          );

          if (currentIndex > 0) {
            setPrevChapterId(validChapters[currentIndex - 1].id);
          }
          if (currentIndex !== -1 && currentIndex < validChapters.length - 1) {
            setNextChapterId(validChapters[currentIndex + 1].id);
          }
        }
      } catch (err) {
        console.error("Failed to load chapter data", err);
        setError(true);
      } finally {
        setLoading(false);
        // Scroll to the top when navigating between chapters
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    if (chapterId) fetchChapterData();
  }, [chapterId]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
        }}
      >
        <Spin size="large" />
        <p
          style={{
            color: "var(--accent-primary)",
            marginTop: "20px",
            fontWeight: 700,
            fontSize: "18px",
          }}
        >
          Loading crisp & cozy pages...
        </p>
      </div>
    );

  if (error)
    return (
      <Result
        status="error"
        title={
          <span
            style={{
              color: "var(--text-main)",
              fontFamily: "Comic Sans MS, cursive",
            }}
          >
            Oh no! Failed to load chapter
          </span>
        }
        subTitle={
          <span
            style={{
              color: "var(--text-muted)",
              fontFamily: "Comic Sans MS, cursive",
            }}
          >
            The MD@Home server might be taking a nap, or the chapter is
            restricted.
          </span>
        }
        extra={
          <Link to="/">
            <Button
              type="primary"
              shape="round"
              style={{
                background: "var(--accent-primary)",
                border: "none",
                fontWeight: "bold",
              }}
            >
              Return to Dashboard
            </Button>
          </Link>
        }
      />
    );

  // Reusable component for the Next/Prev buttons
  const ChapterNavigation = () => (
    <Space style={{ margin: "20px 0" }} size="middle">
      <Button
        type="primary"
        shape="round"
        icon={<LeftOutlined />}
        disabled={!prevChapterId}
        onClick={() => prevChapterId && navigate(`/read/${prevChapterId}`)}
        style={{
          background: prevChapterId ? "var(--accent-primary)" : undefined,
          border: "none",
          fontWeight: "bold",
          boxShadow: prevChapterId
            ? "0 4px 10px rgba(255, 140, 105, 0.3)"
            : "none",
        }}
      >
        Previous Chapter
      </Button>

      <Button
        type="primary"
        shape="round"
        disabled={!nextChapterId}
        onClick={() => nextChapterId && navigate(`/read/${nextChapterId}`)}
        style={{
          background: nextChapterId ? "var(--accent-primary)" : undefined,
          border: "none",
          fontWeight: "bold",
          boxShadow: nextChapterId
            ? "0 4px 10px rgba(255, 140, 105, 0.3)"
            : "none",
        }}
      >
        Next Chapter <RightOutlined />
      </Button>
    </Space>
  );

  return (
    <div
      style={{
        background: "var(--bg-dark)",
        minHeight: "100vh",
        margin: "-40px -20px",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 0 0 0",
        }}
      >
        {mangaId && mangaTitle && (
          <Link
            to={`/manga/${mangaId}`}
            className="catchy-back-link"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "16px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 28px",
              borderRadius: "30px",
              boxShadow: "0 8px 20px rgba(255, 140, 105, 0.35)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 10,
              marginBottom: "10px",
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: "18px" }} /> Back to{" "}
            {mangaTitle}
          </Link>
        )}

        {/* Top Navigation */}
        <ChapterNavigation />
      </div>

      {/* Pages Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "20px",
          paddingBottom: "20px",
          gap: "12px",
        }}
      >
        {images.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Page ${idx + 1}`}
            className="manga-page"
            style={{
              maxWidth: "100%",
              width: "800px",
              objectFit: "contain",
              backgroundColor: "#FFF0E5",
            }}
            loading="lazy"
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "40px",
        }}
      >
        <ChapterNavigation />
      </div>
    </div>
  );
};

export default MangaReader;
