import { gql } from '@apollo/client';

export const GET_INQUIRIES = gql`
  query GetInquiries($status: String, $limit: Int, $offset: Int) {
    getInquiries(status: $status, limit: $limit, offset: $offset) {
      total
      items {
        id
        name
        email
        phone
        city
        language
        preferredCallTime
        message
        source
        status
        createdAt
        responses {
          id
          content
          createdAt
          author {
            id
            displayName
          }
        }
      }
    }
  }
`;

export const UPDATE_INQUIRY_STATUS = gql`
  mutation UpdateInquiryStatus($id: ID!, $status: String!) {
    updateInquiryStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const REPLY_TO_INQUIRY = gql`
  mutation ReplyToInquiry($id: ID!, $content: String!) {
    replyToInquiry(id: $id, content: $content) {
      id
      status
    }
  }
`;

export const SUBMIT_INQUIRY = gql`
  mutation SubmitInquiry($input: SubmitInquiryInput!) {
    submitInquiry(input: $input) {
      id
      status
    }
  }
`;
