import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { API_URL } from '../config';

const httpLink = createHttpLink({
    // Use localhost for web, or machine IP for physical device
    uri: API_URL,
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

export default client;
