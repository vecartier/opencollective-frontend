import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import { capitalize } from '../lib/utils';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

/**
 * This page is used to approve/reject in one click an expense or a collective
 */
class ActionPage extends React.Component {
  static getInitialProps({ query: { action, table, id } }) {
    return { action, table, id, ssr: false };
  }

  static propTypes = {
    action: PropTypes.string,
    table: PropTypes.string,
    id: PropTypes.string,
    ssr: PropTypes.bool,
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    this.state = { loading: true };
    this.mutation = `${props.action}${capitalize(props.table).replace(
      /s$/,
      '',
    )}`;
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    try {
      const res = await this.props[this.mutation](this.props.id);
      console.log('>>> res', JSON.stringify(res));
      this.setState({ loading: false });
    } catch (error) {
      console.log('>>> error', JSON.stringify(error));
      this.setState({ loading: false, error: error.graphQLErrors[0] });
    }
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { action } = this.props;
    const { LoggedInUser, loading } = this.state;

    return (
      <div className="ActionPage">
        <Header
          title={action}
          className={this.state.loading ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <div className="content">
            {loading &&
              this.mutation === 'approveCollective' && (
                <FormattedMessage
                  id="actions.approveCollective.processing"
                  defaultMessage="Approving collective"
                />
              )}
            {loading &&
              this.mutation === 'approveExpense' && (
                <FormattedMessage
                  id="actions.approveExpense.processing"
                  defaultMessage="Approving expense"
                />
              )}
            {loading &&
              this.mutation === 'rejectExpense' && (
                <FormattedMessage
                  id="actions.rejectExpense.processing"
                  defaultMessage="Rejecting expense"
                />
              )}
            {!loading &&
              !this.state.error && (
                <FormattedMessage id="actions.done" defaultMessage="done " />
              )}
            {this.state.error && (
              <div className="error">
                <h2>
                  <FormattedMessage id="error.label" defaultMessage="Error" />
                </h2>
                <div className="message">{this.state.error.message}</div>
              </div>
            )}
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const getQueryForAction = action => gql`
mutation ${action}($id: Int!) {
  ${action}(id: $id) {
    id
  }
}
`;
/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

const addMutationForAction = action =>
  graphql(getQueryForAction(action), {
    props: ({ mutate }) => ({
      [action]: async id => {
        return await mutate({ variables: { id } });
      },
    }),
  });

const actions = ['approveCollective', 'approveExpense', 'rejectExpense'];
const addMutations = compose.apply(
  this,
  actions.map(action => addMutationForAction(action)),
);

export default withData(withIntl(withLoggedInUser(addMutations(ActionPage))));
