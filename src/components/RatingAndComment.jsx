// src/components/RatingAndComment.jsx
import { useState } from "react";
import StarRatings from "react-star-ratings";
import { FaHeart } from "react-icons/fa";

function RatingAndComment({
  currentUser,
  userCompletedSlots,
  userRatings,
  handleRatingChange,
  commentText,
  setCommentText,
  comments,
  handleCommentSubmit,
  handleCommentLike,
  handleCommentDelete,
  visibleComments,
  setVisibleComments,
  displayName,
  navigate,
}) {
  return (
    <div style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ marginRight: "0.5rem", fontSize: "1rem" }}>为该服务打分：</span>

        {!currentUser && <span style={{ color: "#888" }}>请先登录后评分</span>}

        {currentUser && userCompletedSlots.length === 0 && (
          <span style={{ color: "#888" }}>服务完成后可评分</span>
        )}

        {currentUser && userCompletedSlots.length > 0 && userRatings.length > 0 && (
          <>
            <StarRatings
              rating={userRatings[0].rating}
              starRatedColor="#facc15"
              starEmptyColor="#d1d5db"
              starDimension="28px"
              starSpacing="4px"
            />
            <span style={{ marginLeft: "0.5rem", color: "#888" }}>你已完成评分，感谢你的反馈！</span>
          </>
        )}

        {currentUser && userCompletedSlots.length > 0 && userRatings.length === 0 && (
          <StarRatings
            rating={0}
            starRatedColor="#facc15"
            starEmptyColor="#d1d5db"
            starHoverColor="#facc15"
            numberOfStars={5}
            name="user-rating"
            starDimension="28px"
            starSpacing="4px"
            changeRating={handleRatingChange}
          />
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h4>评论区</h4>
        <form onSubmit={handleCommentSubmit} style={{ marginTop: "0.75rem" }}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="写下你的评论..."
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </form>

        {comments.length > 0 ? (
          <>
            {comments.slice(0, visibleComments).map((cmt) => {
              const liked = cmt.likedBy?.includes(currentUser?.uid);
              return (
                <div
                  key={cmt.id}
                  style={{
                    marginBottom: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong
                      style={{ color: "#5c4db1", cursor: "pointer" }}
                      onClick={() => navigate(`/user/${cmt.uid}`)}
                    >
                      @{cmt.displayName}
                    </strong>
                    ：
                    {cmt.text.split(/(@\w+)/g).map((part, i) =>
                      part.startsWith("@") ? (
                        <span
                          key={i}
                          style={{ color: "#f43f5e", cursor: "pointer" }}
                          onClick={() => navigate(`/user/${part.slice(1)}`)}
                        >
                          {part}
                        </span>
                      ) : (
                        part
                      )
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => handleCommentLike(cmt.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: liked ? "#fff0f0" : "#f7f7f7",
                        border: liked ? "1px solid #ff4d6d" : "1px solid #ddd",
                        color: liked ? "#ff4d6d" : "#888",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        boxShadow: liked ? "0 2px 8px rgba(255,77,109,0.2)" : "none",
                      }}
                    >
                      <FaHeart
                        color={liked ? "#ff4d6d" : "#ccc"}
                        size={16}
                        style={{
                          transition: "color 0.2s ease",
                          transform: liked ? "scale(1.1)" : "scale(1)",
                        }}
                      />
                      {cmt.likes || 0}
                    </button>

                    {cmt.uid === currentUser?.uid && (
                      <button
                        onClick={() => handleCommentDelete(cmt.id)}
                        style={{
                          marginLeft: "6px",
                          fontSize: "0.75rem",
                          color: "red",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {comments.length > visibleComments && (
              <button
                onClick={() => setVisibleComments((prev) => prev + 5)}
                style={{
                  marginTop: "1rem",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  backgroundColor: "#f7f7f7",
                  cursor: "pointer",
                }}
              >
                查看更多评论
              </button>
            )}
          </>
        ) : (
          <p style={{ fontSize: "0.9rem", color: "#666" }}>暂无评论</p>
        )}
      </div>
    </div>
  );
}

export default RatingAndComment;
