import {
  Button,
  Carousel,
  Col,
  Container,
  OverlayTrigger,
  Row,
  Tooltip,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import useInfo from '@/lib/swr-hooks/useInfo';
import prisma from '@/lib/db';

export async function getStaticProps() {
  const userCount = await prisma.user.count();
  const randomUsers = await prisma.$queryRaw`
      SELECT user.username, user.name_on_riitag
      FROM user
      WHERE user.coins > 10
      ORDER BY RAND()
      LIMIT 5
  `;

  return {
    props: { userCount, randomUsers },
    revalidate: 10,
  };
}

function IndexPage({ userCount, randomUsers }) {
  const router = useRouter();

  const { user, isLoading } = useInfo();

  useEffect(() => {
    if (router.query.error) {
      window.history.replaceState(null, null, '/');
      toast.error(
        'There was an error while logging you in. Please try again later.'
      );
    }
  }, [router.query.error]);

  return (
    <Container>
      <NextSeo title="Start" />
      <Row>
        <Col className="text-center">
          <h1>Welcome to RiiTag!</h1>
          <p className="mt-4">
            RiiTag is a customizable gamertag for the Wii. By sharing your
            gamertag (a dynamic image), you can show what you&apos;ve been
            playing to your friends! You connect it to a USB Loader, and the tag
            updates on-the-fly. You need a Discord account in order to start
            using RiiTag. Covers are provided by{' '}
            <a href="https://gametdb.com/" target="_blank" rel="noreferrer">
              GameTDB
            </a>{' '}
            and this service is developed by{' '}
            <a href="https://rc24.xyz/" target="_blank" rel="noreferrer">
              RiiConnect24
            </a>
            .
          </p>
        </Col>
      </Row>

      {isLoading === false ? (
        <Row>
          <Col className="d-flex justify-content-center gap-1">
            {user?.username === undefined && (
              <>
                <form method="POST" action="/api/auth/login/discord">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip id="other-accounts-soon-tooltip">
                        More login providers are coming soon!
                      </Tooltip>
                    }
                  >
                    <Button variant="success" size="lg" type="submit">
                      <FontAwesomeIcon className="me-2" icon={faDiscord} />
                      Login with Discord
                    </Button>
                  </OverlayTrigger>
                </form>{' '}
              </>
            )}
            <a
              href="https://wii.guide/riitag"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Button size="lg">
                <FontAwesomeIcon className="me-2" icon={faQuestionCircle} />
                Instructions
              </Button>
            </a>
          </Col>
        </Row>
      ) : null}

      {isLoading === false && user?.username === undefined && (
        <Row className="mt-1">
          <Col>
            <p className="text-center">
              If an account does not exist, it will be created. You agree to our{' '}
              <Link href="/privacy-policy">Privacy Policy</Link> and our{' '}
              <Link href="tos">Terms of Services</Link>.
            </p>
          </Col>
        </Row>
      )}

      {userCount !== 0 && (
        <Row className="mt-2 text-center">
          <Col>
            <h3>
              Join {userCount}{' '}
              {userCount === 1 ? 'other gamer' : 'other gamers'}!
            </h3>
          </Col>
        </Row>
      )}

      {randomUsers.length > 0 && (
        <Row className="text-center">
          <Col>
            <Carousel variant="dark" fade>
              {randomUsers.map((randomUser) => (
                <Carousel.Item key={randomUser.username}>
                  <img
                    className="d-block w-75 mx-auto mt-2"
                    alt={`RiiTag of ${randomUser.username}`}
                    src={`/${randomUser.username}/tag.max.png`}
                  />
                  <Carousel.Caption className="mb-3">
                    <p className="h4">
                      RiiTag of{' '}
                      <Link href={`/user/${randomUser.username}`}>
                        {randomUser.name_on_riitag}
                      </Link>
                    </p>
                  </Carousel.Caption>
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        </Row>
      )}
    </Container>
  );
}

IndexPage.propTypes = {
  userCount: PropTypes.number.isRequired,
  randomUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default IndexPage;
