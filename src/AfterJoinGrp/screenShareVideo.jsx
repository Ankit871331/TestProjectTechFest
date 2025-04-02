import React, { forwardRef } from "react";
import styled from "styled-components";

const ScreenShareVideo = forwardRef((props, ref) => {

    console.log("videoRef:", ref);
    return (
        <Container>
            <StyledVideo ref={ref} autoPlay playsInline />
        </Container>
    );
});

export default ScreenShareVideo;

const Container = styled.div`
    display: flex;
    align-items: center;
    background-color: #121212;
    padding-left: 90px;
    width: calc(100vw - 80px);
`;

const StyledVideo = styled.video`
    width: 100vw;
    height: 80vh;
    max-width: 1400px;
    max-height: 700px;
    border-radius: 10px;
    object-fit: cover;

    @media (max-width: 1024px) {
        width: 90vw;
        height: 60vh;
    }

    @media (max-width: 768px) {
        width: 95vw;
        height: 50vh;
    }

    @media (max-width: 480px) {
        width: 100%;
        height: auto;
    }
`;
