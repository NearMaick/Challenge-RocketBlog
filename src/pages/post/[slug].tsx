import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { RichText } from 'prismic-dom';
import { Fragment } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';

import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  prevPost: Post;
  nextPost: Post;
}

export default function Post({
  post,
  nextPost,
  prevPost,
}: PostProps): JSX.Element {
  // console.log(JSON.stringify(post, null, 2));
  // console.log(estimatedReadTime);

  const textBody = post.data.content.map(cont => {
    return RichText.asText([...cont.body]);
  });

  const textHeading = post.data.content.map(cont => cont.heading);

  const estimatedReadTime = Math.ceil(
    (JSON.stringify(textBody).split(' ').length +
      JSON.stringify(textHeading).split(' ').length) /
      200
  );

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.postBanner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postHeading}>
            <div>
              <time>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              <h2>
                <FiUser />
                {post.data.author}
              </h2>
              <span>
                <FiClock />
                {`${estimatedReadTime} min`}
              </span>
            </div>
            <div>
              <time>*editado em 19 out 2021, às 12:00</time>
            </div>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(cont => (
              <Fragment key={cont.heading}>
                <h3>{cont.heading}</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(cont.body),
                  }}
                />
              </Fragment>
            ))}
          </div>
          <section className={styles.postLink}>
            {prevPost && (
              <div>
                <p>{prevPost.data.title}</p>
                <Link href={`/post/${prevPost.uid}`}>
                  <a>Post Anterior</a>
                </Link>
              </div>
            )}
            {nextPost && (
              <div>
                <p>{nextPost.data.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a className={styles.next}>Próximo post</a>
                </Link>
              </div>
            )}
          </section>
          <Comments />
          <button type="button">Sair do modo Preview</button>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async content => {
  const { slug } = content.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const previousPostResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
      after: response.id,
    }
  );

  const nextPostResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  );

  const prevPost = previousPostResponse.results[0] || null;
  const nextPost = nextPostResponse.results[0] || null;

  return {
    props: {
      post: response,
      nextPost,
      prevPost,
    },
  };
};
