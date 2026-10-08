// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CampusDAO
/// @notice A lightweight proposal voting contract for classroom DApp demonstrations.
/// @dev Each address may vote once per proposal. It does not prove one-human-one-vote.
contract CampusDAO {
    enum Outcome {
        Pending,
        Passed,
        Rejected,
        Tie
    }

    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        uint64 createdAt;
        uint64 endTime;
        uint32 supportVotes;
        uint32 opposeVotes;
        bool finalized;
        Outcome outcome;
    }

    uint256 public constant MIN_DURATION_MINUTES = 1;
    uint256 public constant MAX_DURATION_MINUTES = 10_080; // 7 days
    uint256 public constant MAX_TITLE_BYTES = 80;
    uint256 public constant MAX_DESCRIPTION_BYTES = 300;

    uint256 public totalProposals;

    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    error EmptyTitle();
    error TitleTooLong();
    error EmptyDescription();
    error DescriptionTooLong();
    error InvalidDuration();
    error ProposalNotFound();
    error VotingClosed();
    error AlreadyVoted();
    error VotingStillOpen();
    error AlreadyFinalized();

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string title,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        Outcome outcome,
        uint256 supportVotes,
        uint256 opposeVotes
    );

    /// @notice Creates a proposal that is immediately open for voting.
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 durationMinutes
    ) external returns (uint256 proposalId) {
        uint256 titleLength = bytes(title).length;
        uint256 descriptionLength = bytes(description).length;

        if (titleLength == 0) revert EmptyTitle();
        if (titleLength > MAX_TITLE_BYTES) revert TitleTooLong();
        if (descriptionLength == 0) revert EmptyDescription();
        if (descriptionLength > MAX_DESCRIPTION_BYTES) {
            revert DescriptionTooLong();
        }
        if (
            durationMinutes < MIN_DURATION_MINUTES ||
            durationMinutes > MAX_DURATION_MINUTES
        ) revert InvalidDuration();

        proposalId = ++totalProposals;
        uint64 createdAt = uint64(block.timestamp);
        uint64 endTime = uint64(
            block.timestamp + (durationMinutes * 1 minutes)
        );

        _proposals[proposalId] = Proposal({
            id: proposalId,
            creator: msg.sender,
            title: title,
            description: description,
            createdAt: createdAt,
            endTime: endTime,
            supportVotes: 0,
            opposeVotes: 0,
            finalized: false,
            outcome: Outcome.Pending
        });

        emit ProposalCreated(proposalId, msg.sender, title, endTime);
    }

    /// @notice Casts one support or oppose vote for the connected address.
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = _proposalOrRevert(proposalId);

        if (block.timestamp >= proposal.endTime || proposal.finalized) {
            revert VotingClosed();
        }
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.supportVotes += 1;
        } else {
            proposal.opposeVotes += 1;
        }

        emit VoteCast(proposalId, msg.sender, support);
    }

    /// @notice Records the final outcome after the voting deadline.
    /// @dev Anyone may finalize because the result is calculated deterministically.
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = _proposalOrRevert(proposalId);

        if (block.timestamp < proposal.endTime) revert VotingStillOpen();
        if (proposal.finalized) revert AlreadyFinalized();

        proposal.finalized = true;

        if (proposal.supportVotes > proposal.opposeVotes) {
            proposal.outcome = Outcome.Passed;
        } else if (proposal.supportVotes < proposal.opposeVotes) {
            proposal.outcome = Outcome.Rejected;
        } else {
            proposal.outcome = Outcome.Tie;
        }

        emit ProposalFinalized(
            proposalId,
            proposal.outcome,
            proposal.supportVotes,
            proposal.opposeVotes
        );
    }

    /// @notice Returns one proposal, reverting when the ID does not exist.
    function getProposal(
        uint256 proposalId
    ) external view returns (Proposal memory) {
        return _proposalOrRevert(proposalId);
    }

    function _proposalOrRevert(
        uint256 proposalId
    ) private view returns (Proposal storage proposal) {
        if (proposalId == 0 || proposalId > totalProposals) {
            revert ProposalNotFound();
        }
        proposal = _proposals[proposalId];
    }
}
